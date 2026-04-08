import { useMemo, useState } from "react";

import { Link } from "react-router-dom";

import { useFolders } from "../context/FoldersContext";

import { formatFolderDate } from "../data/folderStorage";

import "./Projects.css";



type SortKey = "latest" | "name";



export function Projects() {

  const { folders, createFolder, removeFolder } = useFolders();

  const [newFolderOpen, setNewFolderOpen] = useState(false);

  const [folderName, setFolderName] = useState("");

  const [folderError, setFolderError] = useState("");

  const [sort, setSort] = useState<SortKey>("latest");



  const sorted = useMemo(() => {

    const copy = [...folders];

    if (sort === "name") {

      copy.sort((a, b) => a.name.localeCompare(b.name, "ko"));

    } else {

      copy.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    }

    return copy;

  }, [folders, sort]);



  const handleCreate = () => {

    setFolderError("");

    const ok = createFolder(folderName);

    if (ok) {

      setFolderName("");

      setNewFolderOpen(false);

    } else {

      setFolderError("1~40자 공백이 아닌 이름을 입력해 주세요.");

    }

  };



  const handleDelete = (id: string, name: string) => {

    if (
      window.confirm(
        `「${name}」 폴더를 휴지통으로 옮길까요?\n휴지통에서 복구하거나 영구 삭제할 수 있습니다.`
      )
    ) {
      removeFolder(id);
    }

  };



  return (

    <div className="doc-page">

      <header className="doc-toolbar">

        <h1 className="doc-toolbar__title">문서</h1>

        <div className="doc-toolbar__actions">
          <label className="doc-tool-sort">
            <span className="visually-hidden">정렬</span>
            <select
              className="doc-tool-select"
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
            >
              <option value="latest">최신순</option>
              <option value="name">이름순</option>
            </select>
          </label>
        </div>

      </header>



      <p className="doc-lead">

        발표 영상 녹화·PPT·채점 결과를 주제별 폴더에 모읍니다. 데이터는 <strong>이 브라우저</strong>에 저장됩니다.

      </p>



      <ul className="doc-grid">

        <li>
          <button type="button" className="doc-card doc-card--new" onClick={() => setNewFolderOpen(true)}>
            <div className="doc-card__thumb doc-card__thumb--new" aria-hidden>
              <span className="doc-card__new-plus">+</span>
            </div>
            <div className="doc-card__body doc-card__body--new">
              <span className="doc-card__name">새 폴더</span>
              <span className="doc-card__meta">이름을 정하고 추가</span>
            </div>
          </button>
        </li>

        {sorted.map((f) => (

          <li key={f.id}>

            <article className="doc-card">

              <div className="doc-card__thumb">

                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" aria-hidden>

                  <path

                    d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V7z"

                    fill="currentColor"

                  />

                </svg>

              </div>

              <div className="doc-card__body">

                <h2 className="doc-card__name">{f.name}</h2>

                <time className="doc-card__date" dateTime={f.createdAt}>

                  {formatFolderDate(f.createdAt)}

                </time>

                <button
                  type="button"
                  className="doc-card__menu"
                  aria-label={`${f.name} 폴더 삭제`}
                  onClick={() => handleDelete(f.id, f.name)}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
                    <path
                      d="M4 7h16M9 7V5a2 2 0 012-2h2a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V7h14zM10 11v6M14 11v6"
                      stroke="currentColor"
                      strokeWidth="1.75"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>

              </div>

            </article>

          </li>

        ))}

      </ul>



      <aside className="doc-foot" aria-label="다음 단계">
        <p className="doc-foot__text">
          <Link to="/evaluate">발표 평가</Link>에서 폴더를 선택한 뒤 녹화·업로드할 수 있습니다.{" "}
          <Link to="/notes">기록 상세</Link>에서 메모를 확인하세요.
        </p>
      </aside>



      {newFolderOpen && (

        <div className="modal-root" role="dialog" aria-modal="true" aria-labelledby="nf-title">

          <div className="modal-backdrop" onClick={() => { setNewFolderOpen(false); setFolderError(""); }} />

          <div className="modal-card">

            <div className="modal-card__head">

              <span className="modal-card__icon">📁</span>

              <div>

                <h2 id="nf-title" className="modal-card__title">

                  새 폴더

                </h2>

                <p className="modal-card__sub">이 폴더에 녹화·PPT·채점 기록이 함께 저장됩니다.</p>

              </div>

            </div>

            <input

              className="modal-input"

              placeholder="예: 중간발표, 캡스톤 최종"

              maxLength={40}

              value={folderName}

              onChange={(e) => {

                setFolderName(e.target.value);

                setFolderError("");

              }}

              onKeyDown={(e) => {

                if (e.key === "Enter") handleCreate();

              }}

            />

            <div className="modal-meta">{folderName.length}/40</div>

            {folderError ? <p className="modal-error">{folderError}</p> : null}

            <div className="modal-actions">

              <button

                type="button"

                className="modal-link"

                onClick={() => {

                  setNewFolderOpen(false);

                  setFolderError("");

                }}

              >

                취소

              </button>

              <button type="button" className="modal-link" onClick={handleCreate}>

                만들기

              </button>

            </div>

          </div>

        </div>

      )}

    </div>

  );

}

