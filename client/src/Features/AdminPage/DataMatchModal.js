function TakeMatchModal({ matchData, isOpenModal, setIsOpenModal }) {
  function closeModal() {
    setIsOpenModal(false);
  }

  const downloadJSON = async () => {
  if (!matchData) return;

  const matchId = matchData.local?.match || matchData.match_id || "data";

  try {
    // ⚡ Берём сырые данные напрямую, а не из state
    const res = await fetch(`https://api.opendota.com/api/matches/${matchId}`);
    const text = await res.text();

    console.log("Размер JSON перед сохранением:", text.length);

    const blob = new Blob([text], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `match_${matchId}.json`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (err) {
    console.error("Ошибка при скачивании JSON:", err);
  }
};

  if (!isOpenModal) return null;
  
  return (
    <div className="takeModal-overlay">
      <div className="takeModal">
        {!matchData ? (
          <p>Загрузка данных матча...</p>
        ) : (
          <>
            <h3>Данные для анализа матча {matchData?.local?.match || matchData?.match_id || "?"}</h3>

            <button onClick={downloadJSON}>
              Скачать данные матча
            </button>
          </>
        )}

        <button onClick={closeModal} style={{ marginTop: "10px" }}>
          Закрыть
        </button>
      </div>
    </div>
  );
}

export default TakeMatchModal;