import { useEffect, useState } from "react"
import { supabase } from "../../createSupabase/supabase"

function AnalyzeResult() {
  const [matchIds, setMatchIds] = useState([])
  const [selectMatch, setSelectMatch] = useState(null)
  const [analyzeData, setAnalyzeData] = useState(null)
  const [isOpenModal, setIsOpenModal] = useState(false)

  useEffect(() => {
    async function takeAnalyzeResult() {
      try {
        const res = await fetch("http://localhost:5000/take-session-auth_id", { credentials: "include" })
        const userData = await res.json()
        const authUid = userData.authUid

        const { data, error } = await supabase
          .from("ResultAnalyze")
          .select("match_id")
          .eq("user_auth_uid", authUid)

          console.log("Auth UID:", authUid)
        if (error) throw error

        setMatchIds(data.map((item) => item.match_id))
      } catch (err) {
        console.error("Ошибка загрузки анализов:", err.message)
      }
    }

    takeAnalyzeResult()
  }, [])

    const handleOverlayClick = (e) => {
    if (e.target.classList.contains("modal-overlay")) {
      setIsOpenModal(false);
    }
  };

  async function openModal(matchId) {
    setSelectMatch(matchId)
    setIsOpenModal(true)

    const { data, error } = await supabase
    .from('ResultAnalyze')
    .select('result, grade, advice, match_id')
    .eq('match_id', matchId)
    .single()

    if(error) {
        console.error('Ошибка:' + error.message)
    } else {
        setAnalyzeData(data)
    }
  }

  function closeModal() {
    setIsOpenModal(false)
    setAnalyzeData(null)
    setSelectMatch(null)
  }



  return (
    <div className="analyzeHistory">
      <h2>История анализов</h2>
      <ul>
        {matchIds.map((id, idx) => (
          <li key={idx}>
            Матч №{id} <button onClick={() => openModal(id)}>Посмотреть</button>
          </li>
          
        ))}
        
      </ul>
      {isOpenModal && analyzeData && (
  <div className="modal-overlay" onClick={handleOverlayClick}>
    <div className="modal">
      <h3 className="modal-title">Результат анализа матча №{selectMatch}</h3>
      
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

      <button className="close-btn" onClick={closeModal}>Закрыть</button>
    </div>
  </div>
)}
    </div>
  )
}

export default AnalyzeResult