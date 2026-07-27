import { Outlet, useLocation } from "react-router-dom";
import { PAGE_TRANSITION } from "../../utils/animations";

export function PageTransition() {
  const location = useLocation();

  return (
    <div
      key={location.pathname}
      className={`${PAGE_TRANSITION} h-full min-h-0 overflow-y-auto overflow-x-hidden`}
    >
      <Outlet />
    </div>
  );
}
