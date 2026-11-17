import React, { useState } from 'react';
import { ChevronDown, HelpCircle, MessageSquare } from 'lucide-react';
import { Link } from 'react-router-dom';

const FAQ = () => {
  const [openIndex, setOpenIndex] = useState(0); // Open first by default

  const faqs = [
    {
      q: "How does a patient book an appointment?",
      a: "Patients can self-book online through the portal — select an available specialist, choose an open date & slot, and confirm instantly via Razorpay. Alternatively, clinic front-desk staff can book on a patient's behalf directly at the reception desk."
    },
    {
      q: "What happens if I miss my exercise for a day?",
      a: "Missed sessions are recorded automatically in your recovery timeline. Your physical therapist monitors compliance percentages and symptom curves before your next visit to adjust your rehabilitation program accordingly."
    },
    {
      q: "Can the receptionist accept cash or offline payments?",
      a: "Yes. Front-desk receptionists can register walk-in patients, reserve appointments on the spot, and record payments as paid-at-desk with official tax receipt numbers generated automatically."
    },
    {
      q: "How does the doctor know when a patient experiences acute pain?",
      a: "Patients log pain ratings on a 0 to 10 scale along with voluntary notes and flags during every workout. When pain exceeds clinical thresholds or a new symptom is flagged, an instant Clinical Alert is dispatched to the clinician."
    }
  ];

  return (
    <section id="faq" className="py-16 md:py-24 bg-[#FFFFFF] font-['Inter',system-ui,sans-serif] border-b border-[#EAEAEA]">
      <div className="w-full mx-auto px-4 sm:px-6 md:px-8 lg:px-10 xl:px-12 max-w-5xl">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-12 md:mb-16">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EBF7F2] text-[#008060] text-xs font-semibold uppercase tracking-wider mb-3">
            Common Questions
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-[#111111] tracking-tight mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-sm sm:text-base text-[#616161]">
            Everything you need to know about AlignCare's clinic management and tele-rehabilitation platform.
          </p>
        </div>

        {/* Accordions */}
        <div className="space-y-3.5">
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index;

            return (
              <div 
                key={faq.q}
                className={`rounded-[14px] border transition-all duration-200 overflow-hidden ${
                  isOpen 
                    ? 'border-[#202223] bg-[#FAFAFA] shadow-sm' 
                    : 'border-[#EAEAEA] bg-[#FFFFFF] hover:border-[#D0D0D0]'
                }`}
              >
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  className="w-full py-4 sm:py-5 px-5 sm:px-6 flex items-center justify-between text-left transition-colors cursor-pointer select-none gap-4"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className={`w-2 h-2 rounded-full shrink-0 ${
                      isOpen ? 'bg-[#008060]' : 'bg-[#D0D0D0]'
                    }`} />
                    <span className="text-sm sm:text-base font-semibold text-[#111111]">
                      {faq.q}
                    </span>
                  </div>

                  <div className={`p-1 rounded-full text-[#8A8A8A] transition-transform duration-200 shrink-0 ${
                    isOpen ? 'rotate-180 text-[#111111]' : ''
                  }`}>
                    <ChevronDown size={18} />
                  </div>
                </button>

                {isOpen && (
                  <div className="px-5 sm:px-6 pb-5 pt-1 text-xs sm:text-[13px] text-[#616161] leading-relaxed border-t border-[#F0F0F0] animate-fade-in">
                    <p className="pt-2">{faq.a}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Bottom Support Banner */}
        <div className="mt-12 p-6 rounded-[16px] bg-[#F7F7F7] border border-[#EAEAEA] flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#EBF7F2] text-[#008060] flex items-center justify-center shrink-0">
              <MessageSquare size={20} />
            </div>
            <div>
              <h4 className="text-sm font-bold text-[#111111]">Have additional clinical questions?</h4>
              <p className="text-xs text-[#616161] mt-0.5">Our medical support team is available Monday through Saturday.</p>
            </div>
          </div>

          <Link
            to="/book"
            className="px-4 py-2 bg-[#111111] hover:bg-[#202020] text-white text-xs font-semibold rounded-[8px] transition-colors shrink-0"
          >
            Contact Clinic
          </Link>
        </div>

      </div>
    </section>
  );
};

export default FAQ;
