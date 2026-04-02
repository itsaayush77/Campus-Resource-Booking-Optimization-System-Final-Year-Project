import { Link, useLocation } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import {
  LuArrowRight,
  LuCalendarCheck2,
  LuChartColumn,
  LuClipboardCheck,
  LuClock3,
  LuMapPin,
  LuQrCode,
  LuScanLine,
  LuShieldCheck,
  LuUsers,
  LuCheckCheck,
  LuCircleDot,
} from 'react-icons/lu';

const featureCards = [
  {
    title: 'Real-Time Availability',
    description:
      'Browse classrooms, labs, halls, sports spaces, and equipment with clear capacity, location, and availability details.',
    icon: LuCalendarCheck2,
    accent: 'bg-blue-600',
  },
  {
    title: 'Approval Workflow',
    description:
      'Route booking requests through admins so high-demand resources stay organised and scheduling stays conflict-free.',
    icon: LuShieldCheck,
    accent: 'bg-indigo-600',
  },
  {
    title: 'QR Check-In',
    description:
      'Approved bookings generate QR codes for smoother venue check-in and clearer usage accountability.',
    icon: LuQrCode,
    accent: 'bg-violet-600',
  },
];

const processSteps = [
  {
    title: 'Browse and Request',
    description:
      'Users explore available resources, choose a suitable slot, and submit a request with purpose and attendee details.',
    icon: LuClipboardCheck,
  },
  {
    title: 'Review and Approve',
    description:
      'Admins approve or reject requests to keep bookings transparent and prevent overlapping reservations.',
    icon: LuClock3,
  },
  {
    title: 'Check In with QR',
    description:
      'Approved users check in through QR confirmation while the system tracks completed usage and no-show activity.',
    icon: LuScanLine,
  },
];

const audienceCards = [
  {
    label: 'For Students & Staff',
    points: [
      'Find the right space quickly',
      'Track request status clearly',
      'Receive booking updates in one place',
    ],
  },
  {
    label: 'For Admin Teams',
    points: [
      'Approve requests confidently',
      'Monitor demand trends',
      'Reduce no-shows with QR tracking',
    ],
  },
];

const bookingStages = [
  {
    status: 'Pending',
    statusColor: 'bg-amber-100 text-amber-700',
    dotColor: 'bg-amber-400',
    label: 'Awaiting admin review',
    subLabel: 'Request submitted successfully',
    progress: 33,
    progressColor: 'bg-amber-400',
    icon: LuCircleDot,
    iconColor: 'text-amber-500',
    step: 1,
  },
  {
    status: 'Approved',
    statusColor: 'bg-emerald-100 text-emerald-700',
    dotColor: 'bg-emerald-400',
    label: 'Approval granted',
    subLabel: 'Booking confirmed for the selected slot',
    progress: 66,
    progressColor: 'bg-emerald-500',
    icon: LuCheckCheck,
    iconColor: 'text-emerald-500',
    step: 2,
  },
  {
    status: 'QR Ready',
    statusColor: 'bg-blue-100 text-blue-700',
    dotColor: 'bg-blue-400',
    label: 'Ready for check-in',
    subLabel: 'QR code available before usage time',
    progress: 100,
    progressColor: 'bg-blue-600',
    icon: LuQrCode,
    iconColor: 'text-blue-600',
    step: 3,
  },
];

function usePrefersReducedMotion() {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const updatePreference = () => setReducedMotion(mediaQuery.matches);

    updatePreference();
    mediaQuery.addEventListener('change', updatePreference);

    return () => mediaQuery.removeEventListener('change', updatePreference);
  }, []);

  return reducedMotion;
}

function RevealSection({ children, className = '' }) {
  const ref = useRef(null);
  const prefersReducedMotion = usePrefersReducedMotion();
  const [visible, setVisible] = useState(prefersReducedMotion);

  useEffect(() => {
    if (prefersReducedMotion) {
      setVisible(true);
      return undefined;
    }

    const element = ref.current;
    if (!element) return undefined;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.12 }
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, [prefersReducedMotion]);

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${
        visible ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'
      } ${className}`}
    >
      {children}
    </div>
  );
}

function AnimatedBookingCard() {
  const prefersReducedMotion = usePrefersReducedMotion();
  const [stageIndex, setStageIndex] = useState(0);
  const [animating, setAnimating] = useState(false);

  const stage = bookingStages[stageIndex];
  const Icon = stage.icon;

  useEffect(() => {
    if (prefersReducedMotion) return undefined;

    let timeoutId;
    const intervalId = window.setInterval(() => {
      setAnimating(true);

      timeoutId = window.setTimeout(() => {
        setStageIndex((current) => (current + 1) % bookingStages.length);
        setAnimating(false);
      }, 260);
    }, 2800);

    return () => {
      window.clearInterval(intervalId);
      if (timeoutId) window.clearTimeout(timeoutId);
    };
  }, [prefersReducedMotion]);

  return (
    <div className="relative">
      <div className="absolute pointer-events-none -inset-4 rounded-3xl bg-blue-500/10 blur-3xl" />

      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 shadow-[0_22px_60px_-28px_rgba(37,99,235,0.35)] backdrop-blur-xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400">
              Demo — booking flow
            </p>
            <h3 className="mt-0.5 text-sm font-semibold text-white">
              Seminar Hall A · 10:00 AM
            </h3>
          </div>

          <div className="flex items-center gap-1.5">
            {bookingStages.map((_, index) => (
              <span
                key={index}
                className={`block h-1.5 rounded-full transition-all duration-500 ${
                  index === stageIndex ? 'w-5 bg-blue-400' : 'w-1.5 bg-white/20'
                }`}
              />
            ))}
          </div>
        </div>

        <div
          className={`px-5 py-5 transition-all duration-300 ${
            animating && !prefersReducedMotion
              ? 'translate-y-1 opacity-0'
              : 'translate-y-0 opacity-100'
          }`}
        >
          <div className="flex items-center justify-between mb-5">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${stage.statusColor}`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${stage.dotColor}`} />
              {stage.status}
            </span>
            <Icon className={`h-5 w-5 ${stage.iconColor}`} />
          </div>

          <div className="mb-5">
            <p className="mb-1 flex items-center gap-1.5 text-xs text-slate-400">
              <LuMapPin className="w-3 h-3" />
              Academic Block · Capacity 80
            </p>
            <p className="text-sm font-semibold text-white">{stage.label}</p>
            <p className="mt-0.5 text-xs text-slate-400">{stage.subLabel}</p>
          </div>

          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                Progress
              </span>
              <span className="text-[10px] font-semibold text-slate-400">
                Step {stage.step} of 3
              </span>
            </div>

            <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
              <div
                className={`h-full rounded-full transition-all duration-700 ${stage.progressColor}`}
                style={{ width: `${stage.progress}%` }}
              />
            </div>

            <div className="flex justify-between mt-2">
              {['Requested', 'Approved', 'QR Ready'].map((label, index) => (
                <span
                  key={label}
                  className={`text-[10px] font-medium transition-colors duration-300 ${
                    index < stage.step ? 'text-white' : 'text-slate-600'
                  }`}
                >
                  {label}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 px-5 py-3 border-t border-white/10">
          {[
            { label: 'Resource', value: 'Hall A' },
            { label: 'Time', value: '10:00 AM' },
            { label: 'Duration', value: '2 hrs' },
          ].map(({ label, value }) => (
            <div key={label}>
              <p className="text-[10px] font-medium uppercase tracking-wide text-slate-500">
                {label}
              </p>
              <p className="mt-0.5 text-xs font-semibold text-slate-300">{value}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mt-4">
        {[
          { icon: LuUsers, value: 'Role-Based', label: 'Access control' },
          { icon: LuQrCode, value: 'QR Check-In', label: 'On approval' },
          { icon: LuChartColumn, value: 'Live Insights', label: 'Admin view' },
        ].map(({ icon: Icon, value, label }) => (
          <div
            key={value}
            className="px-3 py-3 text-center border rounded-xl border-white/10 bg-white/5 backdrop-blur-sm"
          >
            <Icon className="w-4 h-4 mx-auto mb-1 text-blue-400" />
            <p className="text-[11px] font-bold leading-tight text-white">{value}</p>
            <p className="mt-0.5 text-[10px] text-slate-500">{label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

const Home = () => {
  const location = useLocation();

  useEffect(() => {
    if (location.hash === '#how-it-works') {
      window.setTimeout(() => {
        document
          .getElementById('how-it-works')
          ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }, [location.hash]);

  return (
    <div className="overflow-hidden bg-slate-50">
      <section
        className="relative px-4 pb-24 pt-14 sm:px-6 lg:px-8 lg:pb-32 lg:pt-20"
        style={{ background: '#0f1117' }}
      >
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div
            className="absolute -top-32 left-1/2 h-[500px] w-[700px] -translate-x-1/2 rounded-full opacity-25"
            style={{
              background: 'radial-gradient(circle, #3b82f6 0%, transparent 70%)',
            }}
          />
        </div>

        <div className="relative grid items-center mx-auto max-w-7xl gap-14 xl:grid-cols-2 xl:gap-20">
          <div>
            <div className="inline-flex items-center px-4 py-2 text-sm font-semibold text-blue-400 border rounded-full border-blue-500/30 bg-blue-500/10">
              Smart booking for modern campuses
            </div>

            <h1 className="mt-6 text-4xl font-black leading-[0.9] tracking-tight text-white sm:text-6xl lg:text-7xl">
              Book Campus
              <br />
              Resources
              <span className="block mt-2 text-transparent bg-gradient-to-r from-blue-400 via-indigo-400 to-violet-400 bg-clip-text">
                Without the Chaos
              </span>
            </h1>

            <p className="max-w-xl mt-6 text-base leading-7 text-slate-400 sm:text-lg sm:leading-8">
              CampusBook helps students, staff, and administrators manage
              classrooms, labs, halls, sports facilities, and equipment through
              one clean workflow with approvals, QR check-in, and live status
              tracking.
            </p>

            <div className="flex flex-col gap-3 mt-8 sm:flex-row">
              <Link
                to="/signup"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-7 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-600/30 transition-colors duration-200 hover:bg-blue-500"
              >
                Get Started
                <LuArrowRight className="w-4 h-4" />
              </Link>

              <Link
                to="/resources"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 px-7 py-3.5 text-sm font-bold text-slate-300 transition-all duration-200 hover:border-white/30 hover:text-white"
              >
                Explore Resources
                <LuArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="flex flex-wrap items-center gap-6 mt-10">
              {[
                'Multiple campus resource categories',
                'Approval workflow built in',
                'QR check-in included',
              ].map((item) => (
                <div key={item} className="flex items-center gap-2 text-sm text-slate-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                  {item}
                </div>
              ))}
            </div>
          </div>

          <AnimatedBookingCard />
        </div>
      </section>

      <section className="px-4 py-20 mx-auto max-w-7xl sm:px-6 lg:px-8 lg:py-24">
        <RevealSection>
          <div className="grid gap-5 lg:grid-cols-3">
            {featureCards.map((feature) => {
              const Icon = feature.icon;

              return (
                <article
                  key={feature.title}
                  className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-soft transition-all duration-200 hover:-translate-y-1 hover:shadow-card"
                >
                  <div className={`absolute bottom-0 left-0 right-0 h-0.5 ${feature.accent}`} />

                  <div className="p-7">
                    <div
                      className={`inline-flex h-11 w-11 items-center justify-center rounded-xl ${feature.accent} shadow-sm`}
                    >
                      <Icon className="w-5 h-5 text-white" />
                    </div>

                    <h3 className="mt-5 text-lg font-extrabold tracking-tight text-slate-900">
                      {feature.title}
                    </h3>
                    <p className="mt-2.5 text-sm leading-6 text-slate-500">
                      {feature.description}
                    </p>
                  </div>
                </article>
              );
            })}
          </div>
        </RevealSection>
      </section>

      <section
        id="how-it-works"
        className="px-4 py-20 scroll-mt-20 sm:px-6 lg:px-8 lg:py-24"
        style={{ background: '#f8fafc' }}
      >
        <div className="mx-auto max-w-7xl">
          <RevealSection>
            <div className="grid gap-12 lg:grid-cols-[0.95fr,1.05fr]">
              <div>
                <span className="inline-flex items-center gap-2 rounded-full border border-slate-100 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-600 shadow-sm">
                  <LuClipboardCheck className="h-3.5 w-3.5 text-blue-600" />
                  Process overview
                </span>

                <h2 className="mt-5 text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">
                  A cleaner flow for
                  <span className="block text-transparent bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text">
                    users and admins
                  </span>
                </h2>

                <p className="max-w-lg mt-4 text-base leading-7 text-slate-500">
                  The platform keeps booking simple for users while giving
                  administrators the control they need to manage limited campus
                  resources responsibly.
                </p>

                <div className="grid gap-4 mt-8">
                  {audienceCards.map((card) => (
                    <div
                      key={card.label}
                      className="p-5 bg-white border rounded-2xl border-slate-200/80 shadow-soft"
                    >
                      <h3 className="text-sm font-extrabold tracking-tight text-slate-900">
                        {card.label}
                      </h3>

                      <div className="mt-3 grid gap-2.5">
                        {card.points.map((point) => (
                          <div
                            key={point}
                            className="flex items-center gap-2.5 text-sm text-slate-500"
                          >
                            <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-blue-500" />
                            {point}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid gap-4">
                {processSteps.map((step, index) => {
                  const Icon = step.icon;
                  const isLast = index === processSteps.length - 1;

                  return (
                    <div key={step.title} className="flex gap-5">
                      <div className="flex flex-col items-center flex-shrink-0">
                        <div className="flex items-center justify-center text-white shadow-sm h-11 w-11 rounded-xl bg-gradient-to-br from-slate-900 to-slate-700">
                          <Icon className="w-5 h-5" />
                        </div>

                        {!isLast && (
                          <div
                            className="flex-1 w-px mt-3 bg-slate-200"
                            style={{ minHeight: '40px' }}
                          />
                        )}
                      </div>

                      <div className={isLast ? 'pb-4' : 'pb-6'}>
                        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400">
                          Step {index + 1}
                        </p>
                        <h3 className="mt-1.5 text-lg font-extrabold tracking-tight text-slate-900">
                          {step.title}
                        </h3>
                        <p className="mt-1.5 text-sm leading-6 text-slate-500">
                          {step.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </RevealSection>
        </div>
      </section>

      <section className="px-4 py-20 mx-auto max-w-7xl sm:px-6 lg:px-8 lg:py-24">
        <RevealSection>
          <div
            className="relative px-8 py-12 overflow-hidden rounded-2xl sm:px-12 lg:px-16"
            style={{ background: '#0f1117' }}
          >
            <div
              className="absolute w-64 h-64 rounded-full pointer-events-none -right-24 -top-24 opacity-20"
              style={{
                background: 'radial-gradient(circle, #6366f1 0%, transparent 70%)',
              }}
            />

            <div className="relative grid items-center gap-8 lg:grid-cols-[1.1fr,0.9fr]">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-blue-400">
                  Ready to explore
                </p>

                <h2 className="mt-3 text-3xl font-black tracking-tight text-white sm:text-4xl">
                  Launch a smoother booking experience across your campus.
                </h2>

                <p className="max-w-lg mt-4 text-base leading-7 text-slate-400">
                  Show users how easy it is to request resources, give admins
                  clearer control, and make every booking feel structured from
                  request to QR check-in.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row lg:justify-end">
                <Link
                  to="/signup"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-6 py-3.5 text-sm font-bold text-slate-900 transition-colors duration-200 hover:bg-slate-100"
                >
                  Create an Account
                  <LuArrowRight className="w-4 h-4" />
                </Link>

                <Link
                  to="/resources"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 px-6 py-3.5 text-sm font-bold text-slate-300 transition-all duration-200 hover:border-white/30 hover:text-white"
                >
                  Browse Resources
                  <LuArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </RevealSection>
      </section>
    </div>
  );
};

export default Home;
