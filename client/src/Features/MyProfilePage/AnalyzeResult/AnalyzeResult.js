import { useEffect, useState } from "react";
import { supabase } from "../../../Shared/createSupabase/supabase";

function AnalyzeResult() {
  const [matchIds, setMatchIds] = useState([]);
  const [selectMatch, setSelectMatch] = useState(null);
  const [analyzeData, setAnalyzeData] = useState(null);
  const [isOpenModal, setIsOpenModal] = useState(false);

  const API_BASE_URL = "https://critiqo-1.onrender.com";

  // Загружаем список матчей при монтировании
  useEffect(() => {
    async function takeAnalyzeResult() {
      try {
        const res = await fetch(`${API_BASE_URL}/take-session-auth_id`, {
          credentials: "include",
        });
        const userData = await res.json();
        const authUid = userData.authUid;

        const { data, error } = await supabase
          .from("ResultAnalyze")
          .select("match_id")
          .eq("user_auth_uid", authUid);

        if (error) throw error;

        setMatchIds(data.map((item) => item.match_id));
      } catch (err) {
        console.error("Ошибка загрузки анализов:", err.message);
      }
    }

    takeAnalyzeResult();
  }, []);

  // Открыть модалку и загрузить данные
  async function openModal(matchId) {
    setSelectMatch(matchId);
    setIsOpenModal(true);
    setAnalyzeData(null); // очищаем прошлые данные, показываем "Загрузка..."

    try {
      const { data, error } = await supabase
        .from("ResultAnalyze")
        .select("result, grade, advice, match_id")
        .eq("match_id", matchId)
        .single();

      if (error) throw error;
      setAnalyzeData(data);
    } catch (err) {
      console.error("Ошибка:", err.message);
    }
  }

  // Закрыть модалку
  function closeModal() {
    setIsOpenModal(false);
    setAnalyzeData(null);
    setSelectMatch(null);
  }

  // Закрытие при клике вне окна
  const handleOverlayClick = (e) => {
    if (e.target.classList.contains("modalOverlay")) {
      closeModal();
    }
  };

  return (
    <div className="analyzeHistory">
      <h2>История анализов</h2>
      <ul>
        {matchIds.map((id, idx) => (
          <li key={idx}>
            Матч №{id}{" "}
            <button onClick={() => openModal(id)}>Посмотреть</button>
          </li>
        ))}
      </ul>

      {isOpenModal && (
        <div className="modalOverlay" onClick={handleOverlayClick}>
          <div className="modal">
            {analyzeData ? (
              <>
                <h3 className="modal-title">
                  Результат анализа матча №{selectMatch}
                </h3>

                <div className="analysis-card">
                  <div className="analysis-section">
                    <h4>📊 Результат</h4>
                    <p>{analyzeData.result}</p>
                  </div>

                  <div className="analysis-section">
                    <h4>💡 Советы</h4>
                    <p>{analyzeData.advice}</p>
                  </div>

                  <div className="analysis-section grade">
                    <h4>⭐ Оценка</h4>
                    <p>{analyzeData.grade}</p>
                  </div>
                </div>
              </>
            ) : (
              <p>Загрузка...</p>
            )}

            <button className="close-btn" onClick={closeModal}>
              Закрыть
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default AnalyzeResult;