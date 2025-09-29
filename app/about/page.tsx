"use client";

import SiteHeader from "@/components/layout/SiteHeader";
import SiteFooter from "@/components/layout/SiteFooter";
import { CheckCircle2, Scissors, ScrollText, HandHeart } from "lucide-react";
import { motion } from "framer-motion";

export default function AboutPage() {
  return (
    <>
      <SiteHeader />
      <main className="about">
        {/* HERO */}
        <section className="hero" aria-label="About RaniRiwaaj">
          <div className="container">
            <span className="pill">About</span>
            <h1>
              <span className="brand">RaniRiwaaj</span>
            </h1>
            <p className="tag">Punjabi Traditional Clothing Brand</p>
          </div>
        </section>

        {/* ESSENCE */}
        <section className="essence">
          <div className="container">
            <div className="lead">
              <h2>Timeless Punjabi Elegance, Tailored for Today</h2>
              <p>
                RaniRiwaaj celebrates the spirit of Punjab through exquisite fabrics,
                meticulous handwork, and silhouettes that honor tradition while
                embracing contemporary comfort. Every piece is designed to feel
                regal yet effortless—crafted to be worn, loved, and remembered.
              </p>
            </div>

            <div className="grid3">
              <motion.div
                variants={{ hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0 } }}
                whileHover={{ y: -3 }}
                transition={{ type: "spring", stiffness: 260, damping: 20 }}
              >
                <div className="card">
                  <div className="title"><Scissors aria-hidden size={22} /><h3>Craftsmanship</h3></div>
                  <p>
                    Hand embroidery, delicate phulkari, gota patti, and artisanal
                    finishes—made in small batches with close attention to detail.
                  </p>
                </div>
              </motion.div>

              <motion.div
                variants={{ hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0 } }}
                whileHover={{ y: -3 }}
                transition={{ type: "spring", stiffness: 260, damping: 20 }}
              >
                <div className="card">
                  <div className="title"><ScrollText aria-hidden size={22} /><h3>Heritage</h3></div>
                  <p>
                    Inspired by Punjabi culture and ceremonies—reviving heirloom
                    aesthetics with refined, modern proportions.
                  </p>
                </div>
              </motion.div>

              <motion.div
                variants={{ hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0 } }}
                whileHover={{ y: -3 }}
                transition={{ type: "spring", stiffness: 260, damping: 20 }}
              >
                <div className="card">
                  <div className="title"><HandHeart aria-hidden size={22} /><h3>Responsibility</h3></div>
                  <p>
                    Conscious sourcing, fair processes, and durable tailoring—pieces
                    made to last beyond seasons and trends.
                  </p>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* FOUNDER */}
        <section className="founder" aria-labelledby="founder-heading">
          <div className="container">
            <div className="panel founder-grid">
              <div className="founder-image">
                <div className="frame">
                  {/* Temporary test image; swap to your own when ready */}
                  <img src="https://images.unsplash.com/photo-1544717305-996b815c338c?auto=format&fit=crop&w=720&q=80" alt="Kashish Garg, Founder of RaniRiwaaj" />
                </div>
                <figcaption className="caption">Kashish Garg • Founder, RaniRiwaaj</figcaption>
              </div>

              <div className="founder-copy">
                <h2 id="founder-heading">From the Founder’s Desk</h2>
                <p className="kicker">A note from our founder</p>
                <blockquote className="note">
                  <p>
                    At RaniRiwaaj, every outfit begins with you—the wearer. We design for ease,
                    movement and confidence, so tradition never feels restrictive and elegance
                    never feels effortful.
                  </p>
                  <p>
                    We collaborate with master <em>karigars</em> to preserve hand-techniques and
                    refine modern proportions. Fabrics are selected for graceful drape and
                    breathability; seams are cleanly finished; weights are balanced so garments
                    sit beautifully for long celebrations and quick everyday moments alike.
                  </p>
                  <p>
                    Our promise is simple: pieces that feel luxurious, photograph beautifully,
                    and wear comfortably—again and again.
                  </p>
                </blockquote>
                <p className="signoff">With love and gratitude,</p>
                <p className="signature">— Kashish Garg</p>
              </div>
            </div>
          </div>
        </section>

        {/* JOURNEY */}
        <section className="journey">
          <div className="container">
            <h2>Our Craft Journey</h2>
            <div className="stepper">
              <motion.div
                variants={{ hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0 } }}
                whileHover={{ y: -2 }}
                transition={{ type: "spring", stiffness: 260, damping: 20 }}
              >
                <div className="step">
                  <span className="badge">01</span>
                  <ScrollText aria-hidden size={20} />
                  <div>
                    <h4>Design & Pattern</h4>
                    <p>Silhouette planning and pattern cutting for graceful movement.</p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                variants={{ hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0 } }}
                whileHover={{ y: -2 }}
                transition={{ type: "spring", stiffness: 260, damping: 20 }}
              >
                <div className="step">
                  <span className="badge">02</span>
                  <Scissors aria-hidden size={20} />
                  <div>
                    <h4>Handwork & Stitching</h4>
                    <p>Phulkari, gota patti and careful construction in small batches.</p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                variants={{ hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0 } }}
                whileHover={{ y: -2 }}
                transition={{ type: "spring", stiffness: 260, damping: 20 }}
              >
                <div className="step">
                  <span className="badge">03</span>
                  <CheckCircle2 aria-hidden size={20} />
                  <div>
                    <h4>Finishing & QC</h4>
                    <p>Pressing, clean seams and final checks for comfort and longevity.</p>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* WHY */}
        <section className="why">
          <div className="container">
            <h2>Why RaniRiwaaj</h2>
            <div className="mini-grid">
              <motion.div
                variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } }}
                whileHover={{ y: -2, scale: 1.01 }}
                transition={{ type: "spring", stiffness: 260, damping: 20 }}
              >
                <div className="mini">
                  <CheckCircle2 aria-hidden size={20} />
                  <div>
                    <h4>Flattering Fits</h4>
                    <p>Elegant proportions and drape for comfort through long celebrations.</p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } }}
                whileHover={{ y: -2, scale: 1.01 }}
                transition={{ type: "spring", stiffness: 260, damping: 20 }}
              >
                <div className="mini">
                  <CheckCircle2 aria-hidden size={20} />
                  <div>
                    <h4>Heritage Details</h4>
                    <p>Phulkari, gota and artisanal finishes—refined for today.</p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } }}
                whileHover={{ y: -2, scale: 1.01 }}
                transition={{ type: "spring", stiffness: 260, damping: 20 }}
              >
                <div className="mini">
                  <CheckCircle2 aria-hidden size={20} />
                  <div>
                    <h4>Quality You Can Feel</h4>
                    <p>Clean finishing and durable tailoring for repeated wear.</p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } }}
                whileHover={{ y: -2, scale: 1.01 }}
                transition={{ type: "spring", stiffness: 260, damping: 20 }}
              >
                <div className="mini">
                  <CheckCircle2 aria-hidden size={20} />
                  <div>
                    <h4>Pan-India Support</h4>
                    <p>Sizing help, care guidance and quick assistance when you need it.</p>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* MATERIALS */}
        <section className="materials">
          <div className="container two">
            <div>
              <h2>Materials & Care</h2>
              <p>We prioritise breathable fabrics and stable colours so your outfit looks pristine on camera and in person. For best results:</p>
              <ul>
                <li>Steam press on low heat; avoid direct contact on embroidery.</li>
                <li>Dry-clean preferred; spot clean gently for quick fixes.</li>
                <li>Store flat or on wide hangers to preserve the fall.</li>
              </ul>
            </div>
            <div className="tip">
              <p><strong>Fit Tip:</strong> If you’re between sizes, choose the larger size for easy alterations at the waist and bust.</p>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="faq">
          <div className="container">
            <h2>FAQs</h2>
            <details>
              <summary>Do you offer custom sizing?</summary>
              <p>Yes—select the closest size and share your measurements at checkout or via our contact page. Minor alterations are complimentary on first purchase in select cities.</p>
            </details>
            <details>
              <summary>What’s the delivery timeline?</summary>
              <p>Ready-to-ship styles dispatch in 24–48 hours. Made-to-order styles take 7–14 days depending on handwork.</p>
            </details>
            <details>
              <summary>How should I care for phulkari and gota?</summary>
              <p>Prefer dry cleaning. If you must press, place a cotton cloth between the iron and the embroidery, and use low steam.</p>
            </details>
          </div>
        </section>

        {/* PROMISE */}
        <section className="promise" aria-labelledby="promise-heading">
          <div className="container">
            <h2 id="promise-heading">Our Promise</h2>
            <p className="promise-lead">What you can expect every time you choose RaniRiwaaj.</p>
            <ul className="checks" role="list">
              <li>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-80px" }}
                  transition={{ type: "spring", stiffness: 260, damping: 20 }}
                >
                  <div className="row">
                    <div className="cell icon"><span className="tick"><CheckCircle2 aria-hidden size={18} /></span></div>
                    <div className="cell text"><span>Authentic hand-embellishments by master <em>karigars</em></span></div>
                  </div>
                </motion.div>
              </li>
              <li>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-80px" }}
                  transition={{ type: "spring", stiffness: 260, damping: 20 }}
                >
                  <div className="row">
                    <div className="cell icon"><span className="tick"><CheckCircle2 aria-hidden size={18} /></span></div>
                    <div className="cell text"><span>Small-batch making with quality checks at every step</span></div>
                  </div>
                </motion.div>
              </li>
              <li>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-80px" }}
                  transition={{ type: "spring", stiffness: 260, damping: 20 }}
                >
                  <div className="row">
                    <div className="cell icon"><span className="tick"><CheckCircle2 aria-hidden size={18} /></span></div>
                    <div className="cell text"><span>Tailored comfort—cut for movement and ease</span></div>
                  </div>
                </motion.div>
              </li>
              <li>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-80px" }}
                  transition={{ type: "spring", stiffness: 260, damping: 20 }}
                >
                  <div className="row">
                    <div className="cell icon"><span className="tick"><CheckCircle2 aria-hidden size={18} /></span></div>
                    <div className="cell text"><span>Responsible sourcing & respectful partnerships</span></div>
                  </div>
                </motion.div>
              </li>
              <li>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-80px" }}
                  transition={{ type: "spring", stiffness: 260, damping: 20 }}
                >
                  <div className="row">
                    <div className="cell icon"><span className="tick"><CheckCircle2 aria-hidden size={18} /></span></div>
                    <div className="cell text"><span>Care guidance to keep your outfit beautiful for years</span></div>
                  </div>
                </motion.div>
              </li>
              <li>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-80px" }}
                  transition={{ type: "spring", stiffness: 260, damping: 20 }}
                >
                  <div className="row">
                    <div className="cell icon"><span className="tick"><CheckCircle2 aria-hidden size={18} /></span></div>
                    <div className="cell text"><span>Protective, eco-conscious packaging & insured shipping</span></div>
                  </div>
                </motion.div>
              </li>
            </ul>
          </div>
        </section>

        <style jsx>{`
        .about {
          /* White • Blue • Black theme */
          --w-container: 1200px;
          --rr-bg: #ffffff;
          --rr-ink: #0b0f14;
          --rr-muted: #5b6676;
          --rr-primary: #0d63ff;   /* blue */
          --rr-primary-2: #0646c8; /* deeper blue */
          --rr-accent: #dce6ff;    /* pale blue */
          --rr-line: #e8edf6;      /* cool line */
          --rr-surface: #f7faff;   /* light blue surface */
          --space-1: 8px; --space-2: 12px; --space-3: 16px; --space-4: 20px; --space-5: 24px; --space-6: 32px; --space-7: 40px; --space-8: 64px; --space-9: 96px;
          --radius-1: 12px; --radius-2: 16px; --radius-3: 20px;
          --shadow-1: 0 6px 24px rgba(11,15,20,.06); --shadow-2: 0 14px 40px rgba(11,15,20,.10);
          padding-top: var(--nav-offset, 0px);
          background: var(--rr-bg);
          color: var(--rr-ink);
        }
        .container { max-width: var(--w-container); margin: 0 auto; padding: 0 24px; }

        /* ---------- HERO ---------- */
        .hero {
          background:
            radial-gradient(1200px 420px at 50% -12%, rgba(13,99,255,0.10), transparent),
            linear-gradient(180deg, #fff 0%, #fff 65%, var(--rr-surface) 100%);
          padding: var(--space-9) 0 var(--space-7);
          text-align: center;
        }
        .pill {
          display: inline-block; font-size: 12px; letter-spacing: .14em;
          text-transform: uppercase; padding: 8px 12px; border-radius: 999px;
          background: rgba(13,99,255,.08); color: var(--rr-primary);
          border: 1px solid rgba(13,99,255,.18);
        }
        h1 { margin: 16px 0 10px; font-size: clamp(40px, 6.2vw, 64px); line-height: 1.04; }
        .brand { background: linear-gradient(90deg, var(--rr-primary), var(--rr-primary-2)); -webkit-background-clip: text; background-clip: text; color: transparent; }
        .tag { color: var(--rr-muted); font-size: clamp(16px, 2.2vw, 18px); max-width: 760px; margin: 0 auto; }

        /* ---------- ESSENCE ---------- */
        .essence { padding: var(--space-8) 0; background: linear-gradient(180deg, #fff 0, #fff 55%, var(--rr-surface) 100%); border-top: 1px solid var(--rr-line); }
        .lead { text-align: center; max-width: 860px; margin: 0 auto var(--space-6); }
        .lead h2 { font-size: clamp(26px, 3.2vw, 36px); margin-bottom: 12px; line-height: 1.2; }
        .lead p { color: var(--rr-muted); max-width: 760px; margin: 0 auto; line-height: 1.7; letter-spacing: .01em; }
        .grid3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 32px; margin-top: 26px; align-items: stretch; }
        .card {
          position: relative;
          isolation: isolate;
          background: linear-gradient(180deg, #ffffff 0%, #f7fbff 100%);
          border: 1px solid var(--rr-line);
          border-radius: var(--radius-2);
          padding: 26px 22px 22px; box-shadow: 0 10px 24px rgba(11,15,20,.06), 0 2px 6px rgba(11,15,20,.04);
          transition: transform .28s ease, box-shadow .28s ease, border-color .28s ease, background .28s ease;
          min-height: 200px; display: grid; grid-template-rows: auto 1fr;
        }
        .card:hover { transform: translateY(-6px); box-shadow: 0 18px 40px rgba(11,15,20,.10), 0 6px 14px rgba(11,15,20,.06); border-color: #dfe6f4; background: linear-gradient(180deg, #ffffff 0%, #eef5ff 100%); }
        .card .title { display: flex; align-items: center; gap: 14px; margin-bottom: 12px; }
        .card .title svg {
          flex: 0 0 auto; color: var(--rr-primary); padding: 12px; border-radius: 16px;
          background: radial-gradient(60% 60% at 30% 20%, #fff 0, rgba(13,99,255,.16) 60%, transparent 100%);
          border: 1px solid rgba(13,99,255,.22);
          box-shadow: inset 0 1px 0 rgba(255,255,255,.85), 0 10px 22px rgba(6,70,200,.10);
          transition: color .25s ease, transform .25s ease, filter .25s ease, background .25s ease, border-color .25s ease;
        }
        .card .title:after { content: ""; flex: 1; height: 1px; background: linear-gradient(90deg, rgba(13,99,255,.14), rgba(220,230,255,.10), transparent); margin-left: 6px; }
        .card:hover .title svg { color: var(--rr-primary-2); transform: translateY(-2px); filter: drop-shadow(0 3px 10px rgba(13,99,255,.4)); background: radial-gradient(60% 60% at 30% 20%, #fff 0, rgba(13,99,255,.22) 60%, transparent 100%); border-color: rgba(13,99,255,.32); }
        .card h3 { margin: 0; font-size: 20px; letter-spacing: .02em; font-weight: 800; }
        .card p { color: var(--rr-muted); line-height: 1.75; margin-top: 10px; max-width: 520px; }

        /* ---------- FOUNDER ---------- */
        .founder { padding: var(--space-8) 0; background: var(--rr-surface); }
        .panel {
          background: linear-gradient(#fff,#fff) padding-box,
                      linear-gradient(180deg, rgba(184,204,255,.28), rgba(13,99,255,.18)) border-box;
          border: 1px solid transparent; border-radius: var(--radius-3);
          padding: clamp(18px, 2.2vw, 28px); box-shadow: var(--shadow-2);
        }
        .founder-grid { display: grid; grid-template-columns: 1fr 1.35fr; gap: 44px; align-items: center; }
        .founder-image { display: flex; flex-direction: column; align-items: center; }
        .frame { width: min(100%, 480px); position: relative; border-radius: var(--radius-3); overflow: hidden; border: 1px solid var(--rr-line); box-shadow: var(--shadow-1); background: linear-gradient(180deg, #f9fbff, #f7faff); }
        .frame img { width: 100%; height: auto; display: block; border-radius: var(--radius-3); }
        .caption { text-align: center; margin-top: 12px; font-size: 14px; color: var(--rr-muted); letter-spacing: .01em; }
        .founder-copy h2 { font-size: clamp(24px, 3vw, 32px); margin-bottom: 10px; }
        .founder-copy { max-width: 720px; }
        .founder-copy p { color: var(--rr-muted); font-size: 16px; line-height: 1.85; }
        .kicker { text-transform: uppercase; letter-spacing: .14em; font-size: 12px; color: var(--rr-primary); margin-bottom: 12px; font-weight: 700; }
        .note {
          position: relative;
          background: linear-gradient(#fff,#fff) padding-box,
                      linear-gradient(90deg, rgba(184,204,255,.45), rgba(13,99,255,.18)) border-box;
          border: 1px solid transparent; border-radius: 18px; padding: 26px 26px 24px 26px;
          box-shadow: var(--shadow-1); font-size: 15.5px; line-height: 1.9;
        }
        .note:before { content: ""; position: absolute; left: 0; top: 0; bottom: 0; width: 6px; border-radius: 18px 0 0 18px; background: linear-gradient(180deg, var(--rr-accent), rgba(13,99,255,.35)); opacity: .45; }
        .signoff { margin-top: 16px; }
        .signature { font-weight: 700; color: var(--rr-primary); }

        /* ---------- JOURNEY ---------- */
        .journey { padding: var(--space-8) 0 var(--space-6); }
        .journey h2 { text-align: center; margin-bottom: 24px; font-size: clamp(22px, 3vw, 32px); }
        .stepper { display: grid; grid-template-columns: repeat(3, 1fr); gap: 22px; position: relative; }
        .stepper:before { content: ""; position: absolute; left: 0; right: 0; top: 8px; height: 2px; background: linear-gradient(90deg, rgba(13,99,255,.12), rgba(184,204,255,.32), rgba(13,99,255,.12)); border-radius: 2px; }
        .stepper:after { content: ""; position: absolute; top: 8px; left: 0; right: 0; height: 0; pointer-events: none; }
        .step {
          position: relative;
          background: linear-gradient(#fff,#fff) padding-box,
                      linear-gradient(180deg, rgba(13,99,255,.18), rgba(184,204,255,.28)) border-box;
          border: 1px solid transparent; border-radius: var(--radius-2);
          padding: 22px 16px 16px; display: flex; gap: 12px; align-items: flex-start; box-shadow: var(--shadow-1);
          transition: transform .25s ease, box-shadow .25s ease;
          min-height: 120px;
        }
        .step:hover { transform: translateY(-2px); box-shadow: var(--shadow-2); }
        .step .badge {
          position: absolute; top: -16px; left: 50%; transform: translateX(-50%);
          display: inline-flex; align-items: center; justify-content: center;
          width: 28px; height: 28px; border-radius: 999px; font-size: 12px; font-weight: 700;
          color: var(--rr-primary);
          background: radial-gradient(circle at 30% 30%, #fff 0 40%, transparent 41%),
                      conic-gradient(from 180deg, rgba(13,99,255,.22), rgba(184,204,255,.42), rgba(13,99,255,.22));
          border: 1px solid rgba(13,99,255,.26);
          box-shadow: 0 6px 14px rgba(11,15,20,.10), inset 0 1px 0 rgba(255,255,255,.8);
        }
        .step svg { color: var(--rr-primary); margin-top: 2px; padding: 6px; border-radius: 10px; background: radial-gradient(60% 60% at 30% 20%, #fff 0, rgba(13,99,255,.16) 60%, transparent 100%); border: 1px solid rgba(13,99,255,.15); transition: color .25s ease, transform .25s ease, filter .25s ease, background .25s ease; }
        .step:hover svg { color: var(--rr-primary-2); transform: translateY(-1px); filter: drop-shadow(0 2px 8px rgba(13,99,255,.45)); background: radial-gradient(60% 60% at 30% 20%, #fff 0, rgba(13,99,255,.24) 60%, transparent 100%); }
        .step h4 { margin: 0 0 6px; font-size: 16px; }
        .step p { color: var(--rr-muted); margin: 0; }

        /* ---------- WHY ---------- */
        .why { padding: 12px 0 var(--space-8); }
        .why h2 { text-align: center; margin-bottom: 22px; font-size: clamp(22px, 3vw, 32px); }
        .mini-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 22px; }
        .mini {
          background: linear-gradient(#fff,#fff) padding-box,
                      linear-gradient(180deg, rgba(184,204,255,.28), rgba(13,99,255,.18)) border-box;
          border: 1px solid transparent; border-radius: var(--radius-2);
          padding: 16px; display: flex; gap: 12px; align-items: flex-start; box-shadow: var(--shadow-1);
          transition: transform .25s ease, box-shadow .25s ease;
          min-height: 128px;
        }
        .mini:hover { transform: translateY(-2px); box-shadow: var(--shadow-2); }
        .mini svg { color: var(--rr-primary); margin-top: 2px; padding: 6px; border-radius: 10px; background: radial-gradient(60% 60% at 30% 20%, #fff 0, rgba(13,99,255,.16) 60%, transparent 100%); border: 1px solid rgba(13,99,255,.15); transition: color .25s ease, transform .25s ease, filter .25s ease, background .25s ease; }
        .mini:hover svg { color: var(--rr-primary-2); transform: translateY(-1px); filter: drop-shadow(0 2px 8px rgba(13,99,255,.45)); background: radial-gradient(60% 60% at 30% 20%, #fff 0, rgba(13,99,255,.24) 60%, transparent 100%); }
        .mini h4 { margin: 0 0 6px; font-size: 15px; }
        .mini p { margin: 0; color: var(--rr-muted); font-size: 14px; }

        /* ---------- MATERIALS ---------- */
        .materials { padding: var(--space-8) 0; background: linear-gradient(180deg, #fff, var(--rr-surface)); }
        .materials .container { max-width: 1100px; }
        .two { display: grid; grid-template-columns: 1.4fr 1fr; gap: 24px; }
        .materials ul { margin: 10px 0 0 18px; color: var(--rr-muted); line-height: 1.6; }
        .materials ul li { position: relative; margin: 8px 0; padding-left: 18px; }
        .materials ul li:before { content: ""; position: absolute; left: 0; top: 0.6em; width: 6px; height: 6px; border-radius: 50%; background: radial-gradient(circle at 30% 30%, #fff 0 45%, transparent 46%), linear-gradient(180deg, var(--rr-accent), var(--rr-primary)); box-shadow: 0 0 0 1px rgba(13,99,255,.18); }
        .tip { background: linear-gradient(#fff,#fff) padding-box, linear-gradient(180deg, rgba(13,99,255,.18), rgba(184,204,255,.28)) border-box; border: 1px solid transparent; border-radius: 12px; padding: 16px; box-shadow: var(--shadow-1); border-left: 4px solid var(--rr-accent); }

        /* ---------- FAQ ---------- */
        .faq { padding: var(--space-8) 0 var(--space-6); }
        .faq .container { max-width: 920px; }
        .faq h2 { text-align: center; margin-bottom: 14px; font-size: clamp(22px, 3vw, 32px); }
        .faq details { border: 1px solid var(--rr-line); border-radius: 12px; background: #fff; padding: 14px 16px; margin-top: 12px; box-shadow: var(--shadow-1); }
        .faq summary { cursor: pointer; font-weight: 600; list-style: none; }
        .faq summary::-webkit-details-marker { display: none; }
        .faq summary::after { content: "+"; float: right; font-weight: 600; color: var(--rr-primary); }
        .faq details[open] summary::after { content: "–"; }
        .faq p { color: var(--rr-muted); margin: 10px 0 0; }

        /* ---------- PROMISE ---------- */
        .promise { padding: var(--space-8) 0; position: relative; background: linear-gradient(180deg, #fff 0%, #fff 65%, var(--rr-surface) 100%); }
        .promise:before { content: ""; position: absolute; inset: 0; pointer-events: none; background:
          radial-gradient(340px 240px at 12% 8%, rgba(184,204,255,.22), transparent 60%),
          radial-gradient(420px 260px at 88% 92%, rgba(13,99,255,.10), transparent 62%);
        }
        .promise .container { max-width: 1100px; position: relative; z-index: 1; }
        .promise h2 { text-align: center; margin-bottom: 22px; font-size: clamp(22px, 3vw, 32px); }
        .promise-lead { text-align: center; color: var(--rr-muted); margin: -2px auto 22px; max-width: 720px; letter-spacing: .02em; }
        .checks { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px 28px; }
        .checks li {
          display: flex; align-items: center; gap: 12px; font-size: 15px; color: var(--rr-ink);
          background: linear-gradient(#fff,#fff) padding-box,
                      linear-gradient(180deg, rgba(13,99,255,.16), rgba(184,204,255,.28)) border-box;
          border: 1px solid transparent; border-radius: 14px; padding: 14px 18px;
          transition: transform .25s ease, box-shadow .25s ease, border-color .25s ease, background .25s ease;
          box-shadow: 0 6px 18px rgba(11,15,20,.05);
        }
        .checks li > div.row { display: flex; align-items: center; gap: 12px; }
        .checks li > div.row .cell.icon { flex: 0 0 36px; display: flex; align-items: center; justify-content: center; }
        .checks li > div.row .cell.text { flex: 1 1 auto; min-width: 0; }
        .checks li:hover { transform: translateY(-3px); box-shadow: 0 14px 34px rgba(11,15,20,.10); background: linear-gradient(#fff,#fff) padding-box, linear-gradient(180deg, rgba(13,99,255,.22), rgba(184,204,255,.40)) border-box; }
        .checks li svg { color: var(--rr-primary); width: 18px; height: 18px; transition: color .35s ease, transform .25s ease, filter .25s ease; }
        .checks li .tick { position: relative; margin: 0; width: 28px; height: 28px; border-radius: 999px; display: flex; align-items: center; justify-content: center; background:
          radial-gradient(circle at 30% 30%, #fff 0 32%, transparent 33%),
          conic-gradient(from 180deg, rgba(13,99,255,.22), rgba(184,204,255,.42), rgba(13,99,255,.22));
          border: 1px solid rgba(13,99,255,.28); box-shadow: inset 0 1px 0 rgba(255,255,255,.7); transition: transform .25s ease, border-color .25s ease; }
        .checks li .tick:after { content: ""; position: absolute; inset: -4px; border-radius: inherit; background: radial-gradient(closest-side, rgba(184,204,255,.55), rgba(184,204,255,0) 70%); opacity: 0; transform: scale(.9); transition: opacity .3s ease, transform .3s ease; }
        .checks li:hover .tick { transform: rotate(10deg) scale(1.06); border-color: var(--rr-primary); }
        .checks li:hover .tick:after { opacity: .7; transform: scale(1.1); }
        .checks li span { color: var(--rr-muted); }
        .checks li > div.row .cell.text > span { display: block; line-height: 1.55; margin-top: 0; }
        .checks li:hover .cell.text span { color: var(--rr-ink); }

        @media (max-width: 1024px) { .founder-grid { grid-template-columns: 1fr; } }
        @media (max-width: 900px) {
          .grid3 { grid-template-columns: 1fr; }
          .mini-grid { grid-template-columns: 1fr 1fr; }
          .two { grid-template-columns: 1fr; }
          .checks { grid-template-columns: 1fr; }
          .stepper { grid-template-columns: 1fr; }
        }
        `}</style>
      </main>
      <SiteFooter />
    </>
  );
}
