import { useEffect, useState } from "react";

import { Link } from "react-router-dom";

import { IconArrowLeft } from "../components/Icons";

import { useFolders } from "../context/FoldersContext";

import { formatFolderDate } from "../data/folderStorage";

import "./Notes.css";



const NOTES_FOLDER_KEY = "overnight-notes-selected-folder";



export function Notes() {

  const { folders } = useFolders();

  const [folderSheet, setFolderSheet] = useState(false);

  const [fileSheet, setFileSheet] = useState(false);

  const [selectedFolderId, setSelectedFolderId] = useState<string>(() => {

    try {

      return localStorage.getItem(NOTES_FOLDER_KEY) ?? "";

    } catch {

      return "";

    }

  });



  useEffect(() => {

    if (folders.length === 0) {

      setSelectedFolderId("");

      try {

        localStorage.removeItem(NOTES_FOLDER_KEY);

      } catch {

        /* ignore */

      }

      return;

    }

    const exists = folders.some((f) => f.id === selectedFolderId);

    if (!selectedFolderId || !exists) {

      setSelectedFolderId(folders[0].id);

    }

  }, [folders, selectedFolderId]);



  useEffect(() => {

    if (!selectedFolderId) return;

    try {

      localStorage.setItem(NOTES_FOLDER_KEY, selectedFolderId);

    } catch {

      /* ignore */

    }

  }, [selectedFolderId]);



  const selected = folders.find((f) => f.id === selectedFolderId);



  return (

    <div className="page notes-page">

      <div className="page-inner">

        <Link to="/projects" className="notes-back" aria-label="뒤로">

          <IconArrowLeft />

        </Link>

        <h1 className="notes-title">발표 기록</h1>

        <p className="notes-sub">폴더와 파일을 골라 녹화·채점 내역을 확인합니다</p>



        {folders.length === 0 ? (

          <p className="notes-empty">

            폴더가 없습니다.{" "}

            <Link to="/projects" className="notes-empty__link">

              문서에서 폴더 만들기

            </Link>

          </p>

        ) : (

          <>

            <button type="button" className="notes-select" onClick={() => setFolderSheet(true)}>

              <span className="notes-select__label">저장 폴더</span>

              <span className="notes-select__row">

                <span>{selected?.name ?? "선택"}</span>

                <span className="notes-select__ico" aria-hidden>

                  📁

                </span>

              </span>

            </button>



            <button type="button" className="notes-select" onClick={() => setFileSheet(true)}>

              <span className="notes-select__label">저장 파일</span>

              <span className="notes-select__row">

                <span>기록을 선택해 주세요</span>

                <span className="notes-select__ico" aria-hidden>

                  📄

                </span>

              </span>

            </button>

          </>

        )}

      </div>



      {folderSheet && (

        <div className="sheet-root" role="dialog" aria-modal="true" aria-labelledby="sheet-f-title">

          <button type="button" className="sheet-backdrop" onClick={() => setFolderSheet(false)} aria-label="닫기" />

          <div className="sheet-panel">

            <div className="sheet-handle" />

            <div className="sheet-head">

              <span className="sheet-head__icon">📁</span>

              <div>

                <h2 id="sheet-f-title" className="sheet-head__title">

                  폴더 선택

                </h2>

                <p className="sheet-head__sub">발표 영상·자료가 저장된 폴더를 고릅니다.</p>

              </div>

            </div>

            <hr className="sheet-rule" />

            {folders.map((f) => (

              <button

                key={f.id}

                type="button"

                className="sheet-item"

                onClick={() => {

                  setSelectedFolderId(f.id);

                  setFolderSheet(false);

                }}

              >

                <span className="sheet-item__icon">📁</span>

                <div>

                  <strong>{f.name}</strong>

                  <span className="sheet-item__meta">{formatFolderDate(f.createdAt)}</span>

                </div>

              </button>

            ))}

          </div>

        </div>

      )}



      {fileSheet && (

        <div className="sheet-root" role="dialog" aria-modal="true" aria-labelledby="sheet-file-title">

          <button type="button" className="sheet-backdrop" onClick={() => setFileSheet(false)} aria-label="닫기" />

          <div className="sheet-panel">

            <div className="sheet-handle" />

            <h2 id="sheet-file-title" className="sheet-file-heading">

              발표 파일 선택

            </h2>

            <p className="notes-file-hint">

              {selected

                ? `「${selected.name}」에 저장된 발표 기록은 백엔드 연동 후 표시됩니다.`

                : "폴더를 선택해 주세요."}

            </p>

            <button type="button" className="sheet-file-row" onClick={() => setFileSheet(false)}>

              <span className="sheet-file-row__icon">📄</span>

              <div>

                <strong>데모 기록</strong>

                <span className="sheet-item__meta">추후 API 연동</span>

              </div>

            </button>

          </div>

        </div>

      )}

    </div>

  );

}

