import { useEffect, useState, type ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
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
  type LucideIcon,
} from 'lucide-react';

type TourStep = {
  icon: LucideIcon;
  title: string;
  body: string;
  preview: 'register' | 'orders' | 'online' | 'customers' | 'reports' | 'mobile';
  path: string;
};

const TOUR_STEPS: TourStep[] = [
  {
    icon: ShoppingCart,
    title: 'Register + live stream',
    body: 'Build an in-store order on the left. Watch orders appear and move through the live stream on the right.',
    preview: 'register',
    path: '/',
  },
  {
    icon: Globe,
    title: 'Online customer ordering',
    body: 'Choose a sample customer, add items to a cart, and place a pickup or delivery order.',
    preview: 'online',
    path: '/online',
  },
  {
    icon: ClipboardList,
    title: 'Orders dashboard',
    body: 'Filter, search, and review order status across counter and online orders.',
    preview: 'orders',
    path: '/orders',
  },
  {
    icon: Users,
    title: 'Customer desk',
    body: 'Find customers, review history, edit contact info, and start orders from a profile.',
    preview: 'customers',
    path: '/customers',
  },
  {
    icon: LayoutDashboard,
    title: 'Mobile admin view',
    body: 'On mobile, the app becomes a compact admin dashboard instead of a split counter screen.',
    preview: 'mobile',
    path: '/',
  },
];

function SkeletonLine({ wide = false, short = false }: { wide?: boolean; short?: boolean }) {
  return (
    <span
      className={[
        'tutorial-skel-line',
        wide ? 'wide' : '',
        short ? 'short' : '',
      ].join(' ')}
    />
  );
}

function SkeletonCard({ children }: { children?: ReactNode }) {
  return <div className="tutorial-skel-card">{children}</div>;
}

function RegisterPreview() {
  return (
    <div className="tutorial-preview tutorial-preview-register">
      <div className="tutorial-preview-left">
        <div className="tutorial-preview-head">
          <SkeletonLine short />
          <SkeletonLine wide />
        </div>

        <div className="tutorial-skel-grid">
          {Array.from({ length: 6 }).map((_, index) => (
            <SkeletonCard key={index}>
              <SkeletonLine />
              <SkeletonLine short />
            </SkeletonCard>
          ))}
        </div>

        <div className="tutorial-skel-cart">
          <SkeletonLine wide />
          <SkeletonLine />
          <SkeletonLine short />
        </div>
      </div>

      <div className="tutorial-preview-divider" />

      <div className="tutorial-preview-right">
        {Array.from({ length: 3 }).map((_, index) => (
          <div className="tutorial-ticket-skel" key={index}>
            <div>
              <SkeletonLine short />
              <SkeletonLine wide />
            </div>
            <div className="tutorial-ticket-statuses">
              <span />
              <span />
              <span />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function OnlinePreview() {
  return (
    <div className="tutorial-preview tutorial-preview-online">
      <div className="tutorial-phone-frame">
        <div className="tutorial-phone-top">
          <SkeletonLine short />
          <span />
        </div>

        <div className="tutorial-category-row">
          <span />
          <span />
          <span />
        </div>

        <div className="tutorial-online-grid">
          {Array.from({ length: 4 }).map((_, index) => (
            <SkeletonCard key={index}>
              <SkeletonLine />
              <SkeletonLine short />
            </SkeletonCard>
          ))}
        </div>

        <div className="tutorial-cart-strip">
          <SkeletonLine short />
          <SkeletonLine />
        </div>
      </div>
    </div>
  );
}

function OrdersPreview() {
  return (
    <div className="tutorial-preview tutorial-preview-table">
      <div className="tutorial-table-controls">
        <SkeletonLine wide />
        <span />
        <span />
        <span />
      </div>

      <div className="tutorial-table">
        {Array.from({ length: 6 }).map((_, row) => (
          <div className="tutorial-table-row" key={row}>
            <SkeletonLine />
            <SkeletonLine short />
            <SkeletonLine />
            <span />
          </div>
        ))}
      </div>
    </div>
  );
}

function CustomersPreview() {
  return (
    <div className="tutorial-preview tutorial-preview-customers">
      <div className="tutorial-card-row">
        {Array.from({ length: 4 }).map((_, index) => (
          <SkeletonCard key={index}>
            <SkeletonLine short />
            <span className="tutorial-big-number" />
          </SkeletonCard>
        ))}
      </div>

      <div className="tutorial-search-strip">
        <SkeletonLine wide />
        <span />
        <span />
      </div>

      <div className="tutorial-customer-list">
        {Array.from({ length: 4 }).map((_, index) => (
          <div className="tutorial-customer-row" key={index}>
            <span className="tutorial-avatar" />
            <div>
              <SkeletonLine />
              <SkeletonLine short />
            </div>
            <span />
          </div>
        ))}
      </div>
    </div>
  );
}

function ReportsPreview() {
  return (
    <div className="tutorial-preview tutorial-preview-reports">
      <div className="tutorial-report-top">
        <SkeletonCard>
          <SkeletonLine short />
          <span className="tutorial-big-number" />
        </SkeletonCard>
        <SkeletonCard>
          <SkeletonLine short />
          <span className="tutorial-big-number" />
        </SkeletonCard>
      </div>

      <div className="tutorial-chart">
        <span style={{ height: '34%' }} />
        <span style={{ height: '62%' }} />
        <span style={{ height: '46%' }} />
        <span style={{ height: '78%' }} />
        <span style={{ height: '55%' }} />
        <span style={{ height: '88%' }} />
      </div>
    </div>
  );
}

function MobilePreview() {
  return (
    <div className="tutorial-preview tutorial-preview-mobile">
      <div className="tutorial-mobile-frame">
        <div className="tutorial-mobile-hero">
          <SkeletonLine short />
          <span />
        </div>

        <div className="tutorial-mobile-kpis">
          <span />
          <span />
          <span />
        </div>

        <div className="tutorial-mobile-links">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index}>
              <span />
              <SkeletonLine />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function TourPreview({ type }: { type: TourStep['preview'] }) {
  if (type === 'register') return <RegisterPreview />;
  if (type === 'online') return <OnlinePreview />;
  if (type === 'orders') return <OrdersPreview />;
  if (type === 'customers') return <CustomersPreview />;
  if (type === 'reports') return <ReportsPreview />;
  return <MobilePreview />;
}

export default function TutorialToast() {
  const navigate = useNavigate();
  const location = useLocation();

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

  const goToTourStep = (nextStep: number) => {
    setStep(nextStep);

    const nextPath = TOUR_STEPS[nextStep]?.path;
    if (nextPath && location.pathname !== nextPath) {
      navigate(nextPath);
    }
  };

  const openTour = () => {
    setVisible(false);
    setTourOpen(true);
    goToTourStep(0);
  };

  const closeTour = () => {
    setTourOpen(false);
  };

  useEffect(() => {
    const handleStartTutorial = () => {
      setVisible(false);
      setTourOpen(true);
      goToTourStep(0);
    };

    window.addEventListener('groundup:start-tutorial', handleStartTutorial);

    return () => {
      window.removeEventListener('groundup:start-tutorial', handleStartTutorial);
    };
  });

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
            <span>Preview the app flow visually.</span>
          </div>

          <button className="tutorial-toast-action" type="button" onClick={openTour}>
            Start
          </button>
        </div>
      )}

      {tourOpen && (
        <div className={`tutorial-modal-backdrop tutorial-page-focus tutorial-focus-${current.preview}`} onClick={closeTour}>
          <div className="tutorial-modal tutorial-modal-visual" onClick={(event) => event.stopPropagation()}>
            <button
              className="tutorial-modal-close"
              type="button"
              aria-label="Close tutorial"
              onClick={closeTour}
            >
              <X size={18} strokeWidth={2.4} />
            </button>

            <div className="tutorial-modal-grid">
              <div className="tutorial-modal-copy">
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
                      onClick={() => goToTourStep(index)}
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

                      goToTourStep(step + 1);
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

              <TourPreview type={current.preview} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
