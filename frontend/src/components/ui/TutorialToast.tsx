import { useEffect, useState } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  ClipboardList,
  Globe,
  LayoutDashboard,
  PlayCircle,
  ShoppingCart,
  Users,
  X,
} from 'lucide-react';

const TOUR_STEPS = [
  {
    icon: LayoutDashboard,
    title: 'Mobile admin / desktop register',
    body: 'On desktop, Register shows the counter and live order stream. On mobile, the app opens to an admin dashboard.',
  },
  {
    icon: ShoppingCart,
    title: 'Take orders',
    body: 'Use Register for in-store orders. Online customers use the Online page. Both feed into the same order workflow.',
  },
  {
    icon: ClipboardList,
    title: 'Manage the stream',
    body: 'Orders move from Placed to In Prep to Ready. Staff can claim orders and mark progress.',
  },
  {
    icon: Users,
    title: 'Use customer history',
    body: 'Customers stores profiles, loyalty points, order history, notes, and quick start-order actions.',
  },
  {
    icon: Globe,
    title: 'Demo flow',
    body: 'Use Admin → Load demo data, then try Online as a sample customer and watch the order appear in the stream.',
  },
];

export default function TutorialToast() {
  const [visible, setVisible] = useState(false);
  const [tourOpen, setTourOpen] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    const showTimer = window.setTimeout(() => {
      setVisible(true);
    }, 700);

    const hideTimer = window.setTimeout(() => {
      setVisible(false);
    }, 9500);

    return () => {
      window.clearTimeout(showTimer);
      window.clearTimeout(hideTimer);
    };
  }, []);

  const openTour = () => {
    setVisible(false);
    setStep(0);
    setTourOpen(true);
  };

  const closeTour = () => {
    setTourOpen(false);
  };

  const current = TOUR_STEPS[step];
  const CurrentIcon = current.icon;
  const isLastStep = step === TOUR_STEPS.length - 1;

  return (
    <>
      {visible && !tourOpen && (
        <div className="tutorial-toast" role="status">
          <button
            className="tutorial-toast-close"
            type="button"
            aria-label="Dismiss tutorial"
            onClick={() => setVisible(false)}
          >
            <X size={14} strokeWidth={2.4} />
          </button>

          <div className="tutorial-toast-icon">
            <PlayCircle size={18} strokeWidth={2.3} />
          </div>

          <div className="tutorial-toast-copy">
            <strong>Want a 30-second walkthrough?</strong>
            <span>See the fastest way to demo this app.</span>
          </div>

          <button className="tutorial-toast-action" type="button" onClick={openTour}>
            Start
          </button>
        </div>
      )}

      {tourOpen && (
        <div className="tutorial-modal-backdrop" onClick={closeTour}>
          <div className="tutorial-modal" onClick={(event) => event.stopPropagation()}>
            <button
              className="tutorial-modal-close"
              type="button"
              aria-label="Close tutorial"
              onClick={closeTour}
            >
              <X size={18} strokeWidth={2.4} />
            </button>

            <div className="tutorial-modal-icon">
              <CurrentIcon size={24} strokeWidth={2.2} />
            </div>

            <span className="tutorial-modal-eyebrow">
              30-second walkthrough · {step + 1}/{TOUR_STEPS.length}
            </span>

            <h2>{current.title}</h2>
            <p>{current.body}</p>

            <div className="tutorial-progress">
              {TOUR_STEPS.map((item, index) => (
                <button
                  key={item.title}
                  type="button"
                  className={index === step ? 'active' : ''}
                  aria-label={`Go to step ${index + 1}`}
                  onClick={() => setStep(index)}
                />
              ))}
            </div>

            <div className="tutorial-modal-actions">
              <button className="btn-secondary" type="button" onClick={closeTour}>
                Skip
              </button>

              <button
                className="btn-primary"
                type="button"
                onClick={() => {
                  if (isLastStep) {
                    closeTour();
                    return;
                  }

                  setStep((value) => value + 1);
                }}
              >
                {isLastStep ? (
                  <>
                    Done <CheckCircle2 size={15} strokeWidth={2.3} />
                  </>
                ) : (
                  <>
                    Next <ArrowRight size={15} strokeWidth={2.3} />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
