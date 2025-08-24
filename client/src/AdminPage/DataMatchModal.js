import { useState } from "react";

function TakeMatchModal({ matchData, isOpenModal, setIsOpenModal }) {
  function closeModal() {
    setIsOpenModal(false);
  }

  if (!matchData) return null;

  const downloadJSON = () => {
  if (!matchData) return;

  const dataStr = JSON.stringify(matchData, null, 2);
  const blob = new Blob([dataStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;

  // Файл берём по match_id или local.match
  const matchId = matchData.local?.match || matchData.match_id || "data";
  link.download = `match_${matchId}.json`;

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

  return (
    <>
      {isOpenModal && (
        <div className="takeModal-overlay">
          <div className="takeModal">
            <h3>Данные для анализа матча {matchData?.local?.match || "?"}</h3>

            <button onClick={downloadJSON}>
              Скачать данные матча
            </button>

            <button onClick={closeModal} style={{ marginTop: "10px" }}>
              Закрыть
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export default TakeMatchModal;