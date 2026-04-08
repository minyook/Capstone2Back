import { Link, NavLink, Outlet } from "react-router-dom";

import "./WorkspaceShell.css";



export function WorkspaceShell() {

  return (

    <div className="workspace">

      <aside className="workspace__sidebar" aria-label="문서·챗봇">

        <div className="workspace__side-brand">

          <Link to="/" className="workspace__logo-link" title="홈">

            <span className="workspace__logo-mark" aria-hidden>

              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">

                <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" fill="currentColor" />

              </svg>

            </span>

            <span className="workspace__logo-text">Overnight</span>

          </Link>

        </div>



        <nav className="workspace__nav" aria-label="섹션">

          <NavLink

            to="/projects"

            className={({ isActive }) => "workspace__nav-item" + (isActive ? " workspace__nav-item--active" : "")}

            end

          >

            <span className="workspace__nav-ico" aria-hidden>

              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">

                <path d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />

              </svg>

            </span>

            문서

          </NavLink>

          <NavLink

            to="/chatbot"

            className={({ isActive }) => "workspace__nav-item" + (isActive ? " workspace__nav-item--active" : "")}

          >

            <span className="workspace__nav-ico" aria-hidden>

              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">

                <path d="M21 15a4 4 0 01-4 4H8l-4 3V7a4 4 0 014-4h9a4 4 0 014 4v8z" strokeLinejoin="round" />

              </svg>

            </span>

            챗봇

          </NavLink>

        </nav>



        <div className="workspace__side-foot">

          <Link to="/trash" className="workspace__foot-link">

            휴지통

          </Link>

        </div>

      </aside>



      <div className="workspace__main">

        <Outlet />

      </div>

    </div>

  );

}

