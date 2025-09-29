"use client";

import React, { useState } from "react";
import Link from "next/link";
import SiteHeader from "@/components/layout/SiteHeader";
import SiteFooter from "@/components/layout/SiteFooter";
import {
  Mail,
  Phone,
  MapPin,
  Clock,
  MessageSquare,
  Send,
  User,
  AtSign,
  FileText,
  Package,
  ShieldCheck,
} from "lucide-react";
import { motion } from "framer-motion";

export default function ContactPage() {
  // ------- VALIDATION -------
  const [errors, setErrors] = useState<Record<string, string>>({});

  const emailRx = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const phoneRx = /^[0-9+()\-.\s]{7,}$/; // simple intl-friendly check

  function validateField(name: string, value: string) {
    switch (name) {
      case "name":
        return value.trim() ? "" : "Please enter your full name.";
      case "email":
        if (!value.trim()) return "Please enter your email.";
        return emailRx.test(value) ? "" : "Please enter a valid email address.";
      case "message":
        return value.trim().length >= 5
          ? ""
          : "A short message helps us assist you better.";
      case "phone":
        return value && !phoneRx.test(value)
          ? "Please enter a valid phone number."
          : "";
      default:
        return "";
    }
  }

  function handleBlur(
    e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    const { name, value } = e.currentTarget;
    const msg = validateField(name, value);
    setErrors((prev) => ({ ...prev, [name]: msg }));
  }

  // ------- SUBMIT -------
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    a: {
      const fd = new FormData(form);
      const name = (fd.get("name") || "").toString();
      const email = (fd.get("email") || "").toString();
      const phone = (fd.get("phone") || "").toString();
      const orderId = (fd.get("orderId") || "").toString();
      const topic = (fd.get("topic") || "General enquiry").toString();
      const message = (fd.get("message") || "").toString();

      const nextErrors: Record<string, string> = {
        name: validateField("name", name),
        email: validateField("email", email),
        phone: validateField("phone", phone),
        message: validateField("message", message),
      };
      setErrors(nextErrors);

      if (Object.values(nextErrors).some(Boolean)) {
        const firstKey = Object.keys(nextErrors).find((k) => nextErrors[k]);
        const el = form.querySelector(`[name="${firstKey}"]`) as HTMLElement | null;
        el?.focus();
        break a;
      }

      const subject = encodeURIComponent(`${topic} — ${name}`);
      const bodyLines = [
        `Name: ${name}`,
        `Email: ${email}`,
        phone ? `Phone: ${phone}` : "",
        orderId ? `Order ID: ${orderId}` : "",
        `Topic: ${topic}`,
        "",
        message,
      ]
        .filter(Boolean)
        .join("%0D%0A");

      const mailto = `mailto:hello@raniriwaaj.com?subject=${subject}&body=${bodyLines}`;
      window.location.href = mailto;
    }
  };

  return (
    <>
      <SiteHeader />
      <main className="contact">
        {/* HERO */}
        <section className="hero" aria-label="Contact RaniRiwaaj">
          <div className="container">
            <span className="pill">Contact</span>
            <h1>
              Talk to <span className="brand">RaniRiwaaj</span>
            </h1>
            <p className="tag">
              We’re here to help—styling, sizing, orders, alterations, custom
              requests and collaborations.
            </p>
          </div>
        </section>

        {/* QUICK CONTACTS */}
        <section className="quick">
          <div className="container">
            <div className="grid3">
              <motion.div
                className="card-wrap"
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ type: "spring", stiffness: 260, damping: 20 }}
              >
                <div className="card tone-chat">
                  <div className="title">
                    <MessageSquare size={18} aria-hidden />
                    <h3>Chat / WhatsApp</h3>
                  </div>
                  <p>Questions on fit, fabric or delivery? Reach us for quick help.</p>
                  <div className="actions">
                    <a
                      className="btn ghost"
                      href="https://wa.me/919876543210"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Open chat
                    </a>
                  </div>
                </div>
              </motion.div>

              <motion.div
                className="card-wrap"
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ type: "spring", stiffness: 260, damping: 20 }}
              >
                <div className="card tone-mail">
                  <div className="title">
                    <Mail size={18} aria-hidden />
                    <h3>Email Support</h3>
                  </div>
                  <p>
                    For order help, alterations and returns. We reply within 1–2 business
                    days.
                  </p>
                  <div className="actions">
                    <a className="btn ghost" href="mailto:hello@raniriwaaj.com">
                      hello@raniriwaaj.com
                    </a>
                  </div>
                </div>
              </motion.div>

              <motion.div
                className="card-wrap"
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ type: "spring", stiffness: 260, damping: 20 }}
              >
                <div className="card tone-call">
                  <div className="title">
                    <Phone size={18} aria-hidden />
                    <h3>Call Us</h3>
                  </div>
                  <p>Mon–Sat, 10:00–18:00 IST. We love to talk outfits.</p>
                  <div className="meta">
                    <Clock size={16} aria-hidden /> Mon–Sat • 10:00–18:00 IST
                  </div>
                  <div className="actions">
                    <a className="btn ghost" href="tel:+919876543210">
                      +91 98765 43210
                    </a>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* FORM */}
        <section className="form-wrap" aria-labelledby="form-heading">
          <div className="container narrow">
            <div className="panel">
              <div className="form-head">
                <h2 id="form-heading">Send us a message</h2>
                <p>Share a few details—we’ll get back within 1–2 business days.</p>
              </div>

              <form className="form" onSubmit={handleSubmit} noValidate>
                <div className="row two">
                  <div className={`field ${errors.name ? "invalid" : ""}`}>
                    <label htmlFor="name">
                      <User size={14} aria-hidden /> Full name
                    </label>
                    <input
                      id="name"
                      name="name"
                      type="text"
                      required
                      placeholder="Your name"
                      onBlur={handleBlur}
                      aria-invalid={!!errors.name}
                      aria-describedby={errors.name ? "err-name" : undefined}
                    />
                    {errors.name && (
                      <small className="err" id="err-name">
                        {errors.name}
                      </small>
                    )}
                  </div>
                  <div className={`field ${errors.email ? "invalid" : ""}`}>
                    <label htmlFor="email">
                      <AtSign size={14} aria-hidden /> Email
                    </label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      required
                      placeholder="you@example.com"
                      onBlur={handleBlur}
                      aria-invalid={!!errors.email}
                      aria-describedby={errors.email ? "err-email" : undefined}
                    />
                    {errors.email && (
                      <small className="err" id="err-email">
                        {errors.email}
                      </small>
                    )}
                  </div>
                </div>

                <div className="row two">
                  <div className={`field ${errors.phone ? "invalid" : ""}`}>
                    <label htmlFor="phone">
                      <Phone size={14} aria-hidden /> Phone (optional)
                    </label>
                    <input
                      id="phone"
                      name="phone"
                      type="tel"
                      placeholder="+91 …"
                      onBlur={handleBlur}
                      aria-invalid={!!errors.phone}
                      aria-describedby={errors.phone ? "err-phone" : undefined}
                    />
                    {errors.phone && (
                      <small className="err" id="err-phone">
                        {errors.phone}
                      </small>
                    )}
                  </div>
                  <div className="field">
                    <label htmlFor="orderId">
                      <Package size={14} aria-hidden /> Order ID (optional)
                    </label>
                    <input id="orderId" name="orderId" type="text" placeholder="RR-12345" />
                  </div>
                </div>

                <div className="row one">
                  <div className="field">
                    <label htmlFor="topic">
                      <FileText size={14} aria-hidden /> Topic
                    </label>
                    <select id="topic" name="topic" defaultValue="General enquiry">
                      <option>General enquiry</option>
                      <option>Order & delivery</option>
                      <option>Alterations & sizing</option>
                      <option>Custom / made-to-order</option>
                      <option>Wholesale / collaboration</option>
                      <option>Press / media</option>
                    </select>
                  </div>
                </div>

                <div className="row one">
                  <div className={`field ${errors.message ? "invalid" : ""}`}>
                    <label htmlFor="message">
                      <MessageSquare size={14} aria-hidden /> Message
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      required
                      rows={6}
                      placeholder="Tell us a bit about how we can help…"
                      onBlur={handleBlur}
                      aria-invalid={!!errors.message}
                      aria-describedby={errors.message ? "err-message" : undefined}
                    />
                    {errors.message && (
                      <small className="err" id="err-message">
                        {errors.message}
                      </small>
                    )}
                  </div>
                </div>

                <div className="row terms">
                  <div className="mini">
                    <ShieldCheck size={32} strokeWidth={2.6} aria-hidden />
                    <span>
                      We never share your details. By contacting us, you agree to our
                      courteous response policy.
                    </span>
                  </div>
                </div>

                {/* CENTERED BUTTON */}
                <div className="actions center">
                  <button type="submit" className="btn primary">
                    <Send size={16} aria-hidden /> Send message
                  </button>
                </div>
              </form>
            </div>
          </div>
        </section>

        {/* LOCATIONS & HOURS */}
        <section className="locations" aria-labelledby="locations-heading">
          <div className="container two">
            <div className="left">
              <h2 id="locations-heading">Studio & Hours</h2>
              <div className="place">
                <div className="pin">
                  <MapPin size={16} aria-hidden />
                </div>
                <div>
                  <h4>RaniRiwaaj Studio</h4>
                  <p>Ludhiana, Punjab, India</p>
                </div>
              </div>
              <div className="hours">
                <div className="pin">
                  <Clock size={16} aria-hidden />
                </div>
                <div>
                  <h4>Business hours</h4>
                  <p>Mon–Sat: 10:00–18:00 IST • Sun: Closed</p>
                </div>
              </div>
              <p className="note">
                Visits by appointment. Call or message us to schedule a fitting.
              </p>
            </div>

            <div className="right">
              <div className="mapframe">
                <iframe
                  title="RaniRiwaaj Studio Map"
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3431.139922066142!2d75.857275!3d30.900965!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x391a83b8e0c5c2d1%3A0x0!2sLudhiana%2C%20Punjab%2C%20India!5e0!3m2!1sen!2sin!4v1700000000000"
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
            </div>
          </div>
        </section>

        <style jsx>{`
          .contact {
            --w-container: 1200px;
            --rr-bg: #ffffff;
            --rr-ink: #0b0f14;
            --rr-muted: #5b6676;
            --rr-primary: #0d63ff;
            --rr-accent: #dce6ff;
            --rr-line: #e8edf6;
            --space-8: 64px; --space-9: 96px;
            --radius-2: 16px; --radius-3: 20px;
            --shadow-1: 0 6px 24px rgba(11,15,20,.06);
            --shadow-2: 0 14px 40px rgba(11,15,20,.10);
            color: var(--rr-ink);
            background: #fff;
          }
          .container { max-width: var(--w-container); margin: 0 auto; padding: 0 24px; }
          .container.narrow { max-width: 880px; }

          /* HERO */
          .hero {
            text-align: center;
            padding: var(--space-9) 0 var(--space-8);
            background:
              radial-gradient(1200px 420px at 50% -12%, rgba(13,99,255,0.08), transparent),
              linear-gradient(180deg, #fff 0%, #fff 65%, #f7faff 100%);
          }
          .pill {
            display: inline-block;
            font-size: 12px;
            letter-spacing: .14em;
            text-transform: uppercase;
            padding: 8px 12px;
            border-radius: 999px;
            background: rgba(13,99,255,.10);
            color: var(--rr-primary);
            border: 1px solid rgba(13,99,255,.22);
          }
          h1 { margin: 16px 0 10px; font-size: clamp(40px, 6.2vw, 64px); line-height: 1.04; }
          .brand { background: linear-gradient(90deg, var(--rr-primary), #0646c8); -webkit-background-clip: text; background-clip: text; color: transparent; }
          .tag { color: var(--rr-muted); font-size: clamp(16px, 2.2vw, 18px); max-width: 760px; margin: 0 auto; }

          /* QUICK CONTACTS */
          .quick { padding: 40px 0; }
          .grid3 {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 22px;
            grid-auto-rows: 1fr;
            align-items: stretch;
          }
          .grid3 > * { height: 100%; }
          .card-wrap { height: 100%; }
          .card {
            background: #fff;
            border: 1px solid var(--rr-line);
            border-radius: var(--radius-2);
            padding: 22px;
            box-shadow: var(--shadow-1);
            transition: transform .25s ease, box-shadow .25s ease, border-color .25s ease;
            display: grid;
            grid-template-rows: auto 1fr auto;
            height: 100%;
          }
          .card:hover { transform: translateY(-3px); box-shadow: var(--shadow-2); border-color: #dfe6f4; }
          .title { display: flex; align-items: center; gap: 12px; margin-bottom: 10px; }
          .title svg {
            color: var(--rr-primary);
            padding: 8px;
            border-radius: 12px;
            background: radial-gradient(60% 60% at 30% 20%, #fff 0, rgba(13,99,255,.16) 60%, transparent 100%);
            border: 1px solid rgba(13,99,255,.25);
            box-shadow: inset 0 1px 0 rgba(255,255,255,.85);
          }
          .tone-chat .title svg { color: #0a6cf1; }
          .tone-mail .title svg { color: var(--rr-primary); }
          .tone-call .title svg { color: #0653d6; }

          .card h3 { margin: 0; font-size: 18px; }
          .card p { color: var(--rr-muted); margin: 8px 0 12px; }
          .meta { display: inline-flex; align-items: center; gap: 8px; color: var(--rr-muted); font-size: 14px; margin-bottom: 10px; }
          .actions { display: flex; gap: 10px; margin-top: auto; }
          .btn { display: inline-flex; align-items: center; gap: 8px; padding: 10px 14px; border-radius: 999px; font-weight: 600; border: 1px solid #d7e0f5; }
          .btn.ghost { background: #fff; color: var(--rr-primary); }
          .btn.primary { background: var(--rr-primary); color: #fff; border-color: var(--rr-primary); }

          /* FORM */
          .form-wrap { padding: 18px 0 var(--space-8); }
          .panel { background: #fff; border: 1px solid var(--rr-line); border-radius: var(--radius-3); padding: 20px; box-shadow: var(--shadow-2); }
          .form-head { text-align: center; margin-bottom: 18px; }
          .form-head h2 { margin: 0 0 6px; font-size: clamp(24px, 3vw, 32px); }
          .form-head p { color: var(--rr-muted); }
          .form { margin-top: 10px; }
          .row { display: grid; gap: 14px; margin-top: 10px; }
          .row.two { grid-template-columns: 1fr 1fr; }
          .row.one { grid-template-columns: 1fr; }

          .field label { display: inline-flex; align-items: center; gap: 8px; font-weight: 700; margin-bottom: 8px; font-size: 13px; }
          .field input, .field select, .field textarea {
            width: 100%; padding: 10px 12px; border-radius: 12px;
            border: 1px solid #dbe3f5; background: #fff; outline: none;
            transition: border-color .2s ease, box-shadow .2s ease;
          }
          .field textarea { resize: vertical; }
          .field input:focus, .field select:focus, .field textarea:focus {
            border-color: #b8ccff; box-shadow: 0 0 0 4px rgba(13,99,255,.15);
          }
          .field.invalid input, .field.invalid select, .field.invalid textarea {
            border-color: #cc5050; box-shadow: 0 0 0 3px rgba(204,80,80,.14);
          }
          .err { color: #b93b3b; font-size: 12px; margin-top: 6px; }

          /* TERMS NOTE — INLINE ICON BEFORE TEXT, ALIGNED TO FIRST LINE */
          .row.terms .mini {
            display: inline-flex;      /* shrink to content */
            align-items: flex-start;    /* align icon to the first text line */
            gap: 8px;
            color: var(--rr-muted);
            font-size: 14px;
            text-align: left;           /* let the first line start right after the icon */
            margin: 6px auto 0;         /* center the inline-flex block */
            max-width: 720px;
          }
          .row.terms .mini span { display: inline; }
          .row.terms .mini svg { width: 32px; height: 32px; flex: 0 0 32px; color: var(--rr-primary); margin-top: -1px; }
          .row.terms { justify-items: center; }

          /* CENTERED BUTTON */
          .actions.center { display: flex; justify-content: center; margin-top: 10px; }

          /* LOCATIONS */
          .locations { padding: var(--space-8) 0 var(--space-9); background: linear-gradient(180deg, #fff, #f7faff); }
          .two { display: grid; grid-template-columns: 1.15fr 1fr; gap: 28px; align-items: center; }
          .left h2 { margin: 0 0 10px; font-size: clamp(22px, 3vw, 30px); }
          .place, .hours { display: grid; grid-template-columns: 32px 1fr; gap: 12px; align-items: flex-start; padding: 12px 0; }
          .pin {
            display: inline-flex; align-items: center; justify-content: center;
            width: 32px; height: 32px; border-radius: 999px; color: var(--rr-primary);
            background: radial-gradient(60% 60% at 30% 20%, #fff 0, rgba(13,99,255,.16) 60%, transparent 100%);
            border: 1px solid rgba(13,99,255,.24); box-shadow: inset 0 1px 0 rgba(255,255,255,.85);
          }
          .left h4 { margin: 0 0 2px; font-size: 16px; }
          .left p { margin: 0; color: var(--rr-muted); }
          .note { margin-top: 12px; color: var(--rr-muted); }
          .mapframe { position: relative; border: 1px solid var(--rr-line); border-radius: 16px; overflow: hidden; box-shadow: var(--shadow-1); padding-top: 56.25%; }
          .mapframe iframe { position: absolute; inset: 0; width: 100%; height: 100%; border: 0; }

          @media (max-width: 1000px) {
            .grid3 { grid-template-columns: 1fr; }
            .row.two { grid-template-columns: 1fr; }
            .two { grid-template-columns: 1fr; }
          }
        `}</style>
      </main>
      <SiteFooter />
    </>
  );
}
