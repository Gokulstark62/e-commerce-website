const Order = require("../models/orderModel");
const Product = require("../models/productModel");
const User = require("../models/userModel");
const errorHandler = require("../utils/errorHandler");
const Stripe = require("stripe");
const validator = require("validator");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../config.env") });
require("dotenv").config({ path: path.join(__dirname, "../.env") });
require("dotenv").config({ path: path.join(__dirname, "../.env.local") });

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null;
const shippingAmountPaise = Math.round(Number(process.env.SHIPPING_FEE_INR || 0) * 100);
const addressFields = [
  "firstName",
  "lastName",
  "email",
  "street",
  "city",
  "state",
  "zipcode",
  "country",
  "phone",
];

const normalizeAddress = (address) => {
  if (!address || typeof address !== "object" || Array.isArray(address)) {
    throw errorHandler(400, "A delivery address is required.");
  }
  const normalized = {};
  for (const field of addressFields) {
    const value = address[field];
    if (typeof value !== "string" || !value.trim() || value.trim().length > 160) {
      throw errorHandler(400, `Enter a valid ${field} for delivery.`);
    }
    normalized[field] = value.trim();
  }
  if (!validator.isEmail(normalized.email)) {
    throw errorHandler(400, "Enter a valid delivery email address.");
  }
  return normalized;
};

const normalizeItems = (items) => {
  if (!Array.isArray(items) || items.length === 0 || items.length > 50) {
    throw errorHandler(400, "Your cart must contain between 1 and 50 products.");
  }
  const ids = new Set();
  return items.map((item) => {
    const id = Number(item?.id);
    const quantity = Number(item?.quantity);
    if (!Number.isSafeInteger(id) || id < 1 || !Number.isSafeInteger(quantity) || quantity < 1 || quantity > 99) {
      throw errorHandler(400, "Your cart contains an invalid product or quantity.");
    }
    if (ids.has(id)) throw errorHandler(400, "Your cart contains a duplicate product.");
    ids.add(id);
    return { id, quantity };
  });
};

const markOrderPaid = async (session) => {
  const orderId = session.metadata?.orderId;
  const userId = session.metadata?.userId;
  if (!orderId || !userId || session.payment_status !== "paid") return null;

  const order = await Order.findOneAndUpdate(
    { _id: orderId, userId, payment: false },
    { payment: true },
    { new: true }
  );
  if (order) await User.findByIdAndUpdate(userId, { cartData: {} });
  return order;
};

exports.placeOrder = async (req, res, next) => {
  let order;
  try {
    if (!stripe) return next(errorHandler(503, "Online payment is not configured."));
    const requestBody = req.body || {};
    const items = normalizeItems(requestBody.items);
    const address = normalizeAddress(requestBody.address);
    const products = await Product.find({ id: { $in: items.map((item) => item.id) } });
    const productsById = new Map(products.map((product) => [product.id, product]));
    if (products.length !== items.length) {
      return next(errorHandler(400, "One or more products in your cart are no longer available."));
    }

    const orderItems = items.map(({ id, quantity }) => {
      const product = productsById.get(id);
      if (!product.available) {
        throw errorHandler(400, `${product.name} is currently unavailable.`);
      }
      const pricePaise = Math.round(Number(product.new_price) * 100);
      if (!Number.isSafeInteger(pricePaise) || pricePaise < 1) {
        throw errorHandler(400, `${product.name} has an invalid price and cannot be purchased.`);
      }
      return {
        id: product.id,
        name: product.name,
        image: product.image,
        category: product.category,
        new_price: pricePaise / 100,
        old_price: product.old_price,
        quantity,
      };
    });

    const subtotalPaise = orderItems.reduce(
      (total, item) => total + Math.round(item.new_price * 100) * item.quantity,
      0
    );
    if (!Number.isSafeInteger(shippingAmountPaise) || shippingAmountPaise < 0) {
      throw errorHandler(503, "Shipping fees are not configured correctly.");
    }
    const amountPaise = subtotalPaise + shippingAmountPaise;
    order = await Order.create({
      userId: req.user._id.toString(),
      items: orderItems,
      amount: amountPaise / 100,
      address,
    });

    const frontendUrl = (process.env.FRONTEND_URL || "").replace(/\/$/, "");
    if (!frontendUrl) throw errorHandler(503, "The storefront URL is not configured.");
    const session = await stripe.checkout.sessions.create({
      line_items: [
        ...orderItems.map((item) => ({
          price_data: {
            currency: "inr",
            product_data: { name: item.name },
            unit_amount: Math.round(item.new_price * 100),
          },
          quantity: item.quantity,
        })),
        ...(shippingAmountPaise > 0 ? [{
          price_data: {
            currency: "inr",
            product_data: { name: "Shipping" },
            unit_amount: shippingAmountPaise,
          },
          quantity: 1,
        }] : []),
      ],
      mode: "payment",
      metadata: { orderId: order._id.toString(), userId: req.user._id.toString() },
      payment_intent_data: {
        metadata: { orderId: order._id.toString(), userId: req.user._id.toString() },
      },
      success_url: `${frontendUrl}/verify?success=true&orderId=${order._id}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${frontendUrl}/verify?success=false&orderId=${order._id}`,
    });
    order.stripeSessionId = session.id;
    await order.save();
    res.status(200).json({ success: true, session_url: session.url });
  } catch (error) {
    if (order) {
      try {
        await Order.findByIdAndDelete(order._id);
      } catch (cleanupError) {
        console.error("Could not remove the incomplete checkout order:", cleanupError.message);
      }
    }
    next(error);
  }
};

exports.verifyOrder = async (req, res, next) => {
  try {
    const { orderId, success, session_id: sessionId } = req.body;
    const order = await Order.findOne({ _id: orderId, userId: req.user._id.toString() });
    if (!order) return next(errorHandler(404, "Order not found."));

    if (success !== "true") {
      if (order.payment) return res.status(200).json({ success: true, payment: true });
      if (stripe && order.stripeSessionId) {
        const session = await stripe.checkout.sessions.retrieve(order.stripeSessionId);
        if (session.payment_status === "paid") {
          const paidOrder = await markOrderPaid(session);
          return res.status(200).json({ success: true, payment: true, order: paidOrder || order });
        }
        if (session.status === "open") {
          await stripe.checkout.sessions.expire(session.id);
          await Order.findByIdAndDelete(order._id);
        }
      }
      return res.status(200).json({ success: false, payment: false });
    }
    if (!stripe || !sessionId || !order.stripeSessionId) {
      return next(errorHandler(400, "The checkout session could not be verified."));
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (
      session.id !== order.stripeSessionId ||
      session.metadata?.orderId !== order._id.toString() ||
      session.metadata?.userId !== req.user._id.toString()
    ) {
      return next(errorHandler(403, "The checkout session does not match this order."));
    }
    if (session.payment_status !== "paid") {
      return next(errorHandler(409, "Payment has not been confirmed yet."));
    }

    const paidOrder = await markOrderPaid(session);
    res.status(200).json({ success: true, payment: true, order: paidOrder || order });
  } catch (error) {
    next(error);
  }
};

exports.handleStripeWebhook = async (req, res) => {
  if (!stripe || !process.env.STRIPE_WEBHOOK_SECRET) {
    return res.status(503).json({ error: "Stripe webhooks are not configured." });
  }

  let event;
  try {
    const signature = req.headers["stripe-signature"];
    event = stripe.webhooks.constructEvent(req.body, signature, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (error) {
    return res.status(400).json({ error: `Invalid Stripe webhook: ${error.message}` });
  }

  try {
    if (
      event.type === "checkout.session.completed" ||
      event.type === "checkout.session.async_payment_succeeded"
    ) {
      await markOrderPaid(event.data.object);
    }
  } catch (error) {
    console.error("Could not process Stripe webhook:", error.message);
    return res.status(500).json({ error: "Could not process this Stripe event." });
  }
  res.status(200).json({ received: true });
};

exports.userOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({ userId: req.user._id.toString(), payment: true }).sort({ date: -1 });
    res.status(200).json(orders);
  } catch (error) {
    next(error);
  }
};

exports.getAllOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({ payment: true }).sort({ date: -1 });
    res.status(200).json(orders);
  } catch (error) {
    next(error);
  }
};

exports.updateStatus = async (req, res, next) => {
  const allowedStatuses = ["Ordered", "Shipped", "Out for delivery", "Delivered"];
  try {
    const { orderId, status } = req.body;
    if (!allowedStatuses.includes(status)) {
      return next(errorHandler(400, "Choose a valid order status."));
    }
    const order = await Order.findByIdAndUpdate(orderId, { status }, { new: true });
    if (!order) return next(errorHandler(404, "Order not found."));
    res.status(200).json(order);
  } catch (error) {
    next(error);
  }
};
