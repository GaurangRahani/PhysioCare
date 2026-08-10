import React, { useState } from 'react';

const ChevronDown = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="m6 9 6 6 6-6" />
  </svg>
);

const ChevronUp = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="m18 15-6-6-6 6" />
  </svg>
);

const FAQItem = ({ question, answer, isOpen, onClick }) => {
  return (
    <div className="mb-4 overflow-hidden rounded-xl">
      <button
        onClick={onClick}
        className={`w-full flex items-center justify-between py-4 px-6 text-left font-bold transition-all duration-300 focus:outline-none ${
          isOpen 
            ? 'bg-secondary text-white rounded-t-xl' 
            : 'bg-primary text-white rounded-xl hover:bg-dark-brand'
        }`}
      >
        <span className="text-sm md:text-base tracking-wide pr-4">{question}</span>
        <span className="flex-shrink-0">
          {isOpen 
            ? <ChevronUp className="w-5 h-5 text-white" /> 
            : <ChevronDown className="w-5 h-5 text-white" />
          }
        </span>
      </button>
      
      <div 
        className={`overflow-hidden transition-all duration-300 ease-in-out bg-primary/5 ${
          isOpen ? 'max-h-[500px] opacity-100 border-x border-b border-primary/10 rounded-b-xl' : 'max-h-0 opacity-0'
        }`}
      >
        <p className="text-sm text-slate-600 p-6 leading-relaxed">
          {answer}
        </p>
      </div>
    </div>
  );
};

const FAQ = () => {
  const [openIndex, setOpenIndex] = useState(null);

  const faqs = [
    {
      q: "How does a patient book an appointment?",
      a: "Patients can self-book online through the portal — select an available slot, confirm, and pay instantly via Razorpay. Alternatively, the clinic receptionist can book on a patient's behalf and send a payment link directly to the patient's phone."
    },
    {
      q: "What happens if I miss my exercise for a day?",
      a: "Missed sessions are tracked automatically. Your doctor will see your compliance percentage and any missed days at your next visit, so you can discuss what got in the way and adjust the plan if needed."
    },
    {
      q: "Is my medical data secure?",
      a: "All data is stored in a secured PostgreSQL database. Authentication is handled by Clerk, a production-grade identity provider. Payments are processed via Razorpay — PhysioCare never stores any card or payment information."
    },
    {
      q: "Can the doctor change my exercise plan mid-recovery?",
      a: "Yes. The doctor can modify your plan at any visit — change frequency, discontinue exercises, or add new ones. Your past compliance history is always preserved, so changes never erase what you've already done."
    },
    {
      q: "What devices can I use this on?",
      a: "PhysioCare is a web app that works on any modern browser on desktop, tablet, or mobile. A dedicated mobile app may be available in a future version."
    },
    {
      q: "How does the receptionist handle payments?",
      a: "For patients present at the clinic, the receptionist marks payment as collected (cash, card terminal, or UPI). For phone bookings, a Razorpay payment link is sent — the slot is held for 30 minutes while the patient pays."
    },
    {
      q: "How Doctor Can Ease Your Pain?",
      a: "Our clinical staff designs targeted plans containing stretching, loading, and mobilization routines to build strength and safely reduce mechanical pain over time."
    },
    {
      q: "Understand Doctor Before You Regret?",
      a: "Communication is key. Our platform logs your pain scores daily, allowing doctors to proactively adjust limits if any movement is causing adverse irritation."
    }
  ];

  const handleToggle = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  // Split FAQs into two columns
  const col1 = faqs.filter((_, idx) => idx % 2 === 0);
  const col2 = faqs.filter((_, idx) => idx % 2 !== 0);

  return (
    <section id="faq" className="py-24 bg-white relative overflow-hidden">
      {/* Background Shapes */}
      <img className="absolute top-[20%] left-[5%] animate-rotation hidden lg:block opacity-35" src="/images/shap/plus-orange.png" alt="" />
      <img className="absolute bottom-[20%] right-[5%] animate-up-down hidden lg:block opacity-30" src="/images/shap/circle-dots.png" alt="" />

      <div className="container mx-auto px-4 md:px-6 max-w-6xl relative z-10">
        
        {/* Section Header */}
        <div className="text-center mb-16">
          <h6 className="text-secondary font-bold text-sm tracking-wider uppercase mb-3">FAQ</h6>
          <h2 className="text-4xl md:text-5xl font-extrabold text-dark-brand mb-4">
            Common Questions
          </h2>
        </div>

        {/* Two-Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-0">
          
          {/* Column 1 */}
          <div>
            {col1.map((faq, index) => {
              const actualIndex = index * 2;
              return (
                <FAQItem
                  key={actualIndex}
                  question={faq.q}
                  answer={faq.a}
                  isOpen={openIndex === actualIndex}
                  onClick={() => handleToggle(actualIndex)}
                />
              );
            })}
          </div>

          {/* Column 2 */}
          <div>
            {col2.map((faq, index) => {
              const actualIndex = index * 2 + 1;
              return (
                <FAQItem
                  key={actualIndex}
                  question={faq.q}
                  answer={faq.a}
                  isOpen={openIndex === actualIndex}
                  onClick={() => handleToggle(actualIndex)}
                />
              );
            })}
          </div>

        </div>

      </div>
    </section>
  );
};

export default FAQ;
