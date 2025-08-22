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

        if (error) throw error

        setMatchIds(data.map((item) => item.match_id))
      } catch (err) {
        console.error("Ошибка загрузки анализов:", err.message)
      }
    }

    takeAnalyzeResult()
  }, [])

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
        <div className="modal-overlay">
          <div className="modal">
            <h3>Результат анализа матча №{selectMatch}</h3>
            <p><b>Оценка:</b> {analyzeData.grade}</p>
            <p><b>Советы:</b> {analyzeData.advice}</p>
            <p><b>Результат:</b> {analyzeData.result}</p>
            <button onClick={closeModal}>Закрыть</button>
          </div>
        </div>
      )}
    </div>
  )
}

export default AnalyzeResult