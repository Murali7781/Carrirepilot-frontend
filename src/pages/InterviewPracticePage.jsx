import { useEffect, useMemo, useState } from 'react';
import { FiArrowLeft, FiArrowRight, FiCheck, FiCheckCircle, FiClock, FiMessageCircle, FiRotateCcw, FiSend } from 'react-icons/fi';
import { Link, useParams } from 'react-router-dom';
import api from '../services/api';

function answerFor(answers, questionId) {
  return [...answers].reverse().find((answer) => Number(answer.question_id) === Number(questionId));
}

function questionMetadata(question) {
  if (!question?.metadata) return {};
  if (typeof question.metadata === 'object') return question.metadata;
  try { return JSON.parse(question.metadata); } catch { return {}; }
}

export default function InterviewPracticePage() {
  const { id } = useParams();
  const [session, setSession] = useState(null);
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [generationMode, setGenerationMode] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);

  const loadSession = async (moveToUnanswered = false) => {
    const response = await api.get(`/interviews/${id}`);
    const loaded = response.data?.data?.interview || null;
    setSession(loaded);
    if (loaded) {
      const nextIndex = moveToUnanswered ? loaded.questions.findIndex((question) => !answerFor(loaded.answers, question.id)) : currentIndex;
      const selectedIndex = nextIndex < 0 ? 0 : nextIndex;
      setCurrentIndex(selectedIndex);
      setAnswer(answerFor(loaded.answers, loaded.questions[selectedIndex]?.id)?.answer_text || '');
    }
  };

  useEffect(() => {
    let active = true;
    api.get(`/interviews/${id}`)
      .then((response) => {
        if (!active) return;
        const loaded = response.data?.data?.interview || null;
        setSession(loaded);
        if (loaded) {
          const firstUnanswered = loaded.questions.findIndex((question) => !answerFor(loaded.answers, question.id));
          const selectedIndex = firstUnanswered < 0 ? 0 : firstUnanswered;
          setCurrentIndex(selectedIndex);
          setAnswer(answerFor(loaded.answers, loaded.questions[selectedIndex]?.id)?.answer_text || '');
        }
      })
      .catch((err) => { if (active) setError(err.response?.data?.message || 'Unable to load this practice session.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id]);

  const questions = session?.questions || [];
  const answers = session?.answers || [];
  const completedCount = questions.filter((question) => answerFor(answers, question.id)).length;
  const currentQuestion = questions[currentIndex];
  const currentQuestionMetadata = questionMetadata(currentQuestion);
  const currentSavedAnswer = currentQuestion ? answerFor(answers, currentQuestion.id) : null;
  const isSessionComplete = questions.length > 0 && completedCount === questions.length;

  const progress = useMemo(() => questions.length ? Math.round((completedCount / questions.length) * 100) : 0, [completedCount, questions.length]);

  const generate = async () => {
    setWorking(true); setError(''); setNotice('');
    try { const response = await api.post(`/interviews/${id}/questions/generate`); await loadSession(true); setGenerationMode(response.data?.data?.mode || ''); if (response.data?.data?.notice) setNotice(response.data.data.notice); }
    catch (err) { setError(err.response?.data?.message || 'Unable to generate practice questions.'); }
    finally { setWorking(false); }
  };

  const submitAnswer = async (event) => {
    event.preventDefault();
    if (!currentQuestion || answer.trim().length < 5) { setError('Write at least a few words before submitting your answer.'); return; }
    setWorking(true); setError(''); setNotice('');
    try {
      const response = await api.post(`/interviews/${id}/answers`, { question_id: currentQuestion.id, answer_text: answer.trim() });
      await loadSession();
      setNotice(response.data?.data?.feedbackNotice || 'Your answer was saved. Review the feedback, then continue.');
    } catch (err) { setError(err.response?.data?.message || 'Unable to save your answer.'); }
    finally { setWorking(false); }
  };

  const setStatus = async (status) => {
    setWorking(true); setError('');
    try { await api.patch(`/interviews/${id}/status`, { status }); await loadSession(); }
    catch (err) { setError(err.response?.data?.message || 'Unable to update session status.'); }
    finally { setWorking(false); }
  };

  const continuePractice = () => {
    const nextIndex = questions.findIndex((question) => !answerFor(answers, question.id));
    if (nextIndex >= 0) { setCurrentIndex(nextIndex); setAnswer(answerFor(answers, questions[nextIndex]?.id)?.answer_text || ''); setNotice(''); }
    else setNotice('You have answered every question. Review your feedback or mark this session complete.');
  };

  if (loading) return <div className="page-loading" role="status">Opening practice session…</div>;
  if (!session) return <div className="page-section"><div className="alert alert-danger">{error || 'This practice session could not be found.'}</div><Link to="/interviews"><FiArrowLeft /> All practice sessions</Link></div>;

  return <div className="page-section interview-practice-page">
    <div className="practice-back-row"><Link to="/interviews"><FiArrowLeft /> All sessions</Link><span className={`session-status ${session.status}`}>{session.status}</span></div>
    <section className="practice-heading"><div><span className="eyebrow">{session.type?.toUpperCase()} PRACTICE</span><h2>{session.title}</h2><p>{[session.job_title, session.job_company, session.resume_title].filter(Boolean).join(' · ') || 'General interview practice'} </p></div><span className="practice-duration"><FiClock /> Your pace, your time</span></section>
    {error ? <div className="alert alert-danger" role="alert">{error}</div> : null}
    {notice ? <div className="alert alert-info" role="status">{notice}</div> : null}
    {generationMode ? <div className={`practice-generation-mode ${generationMode}`} role="status">Question source: {generationMode === 'openai' ? 'AI-generated from your selected role, job description, and resume' : 'CareerPilot role-aware fallback based on your saved context'}</div> : null}
    {!questions.length ? <section className="practice-start-card panel-card"><span className="practice-start-icon"><FiMessageCircle /></span><span className="eyebrow">READY WHEN YOU ARE</span><h3>Build your question set</h3><p>CareerPilot will use your selected role, job description, and resume to prepare 15 questions that progress from fundamentals to realistic scenarios. You can answer at your own pace and receive feedback after each response.</p><button type="button" className="interview-primary-button" onClick={generate} disabled={working}>{working ? 'Preparing questions…' : 'Generate questions'} <FiArrowRight /></button><small>AI or rule-based generation mode is disclosed when the set is ready.</small></section> : <div className="practice-layout">
      <aside className="practice-progress-card panel-card"><div className="practice-progress-head"><div><span className="eyebrow">SESSION PROGRESS</span><strong>{completedCount} <small>of {questions.length}</small></strong></div><span>{progress}%</span></div><div className="practice-progress-track"><span style={{ width: `${progress}%` }} /></div><div className="practice-question-list">{questions.map((question, index) => { const done = Boolean(answerFor(answers, question.id)); return <button type="button" key={question.id} className={`practice-question-nav${index === currentIndex ? ' selected' : ''}${done ? ' answered' : ''}`} onClick={() => { setCurrentIndex(index); setAnswer(answerFor(answers, question.id)?.answer_text || ''); }}><span>{done ? <FiCheck /> : `${String(index + 1).padStart(2, '0')}`}</span><span>Question {index + 1}</span><small>{done ? 'Answered' : 'To do'}</small></button>; })}</div><div className="practice-help-card"><FiMessageCircle /><p>Take a breath. A clear structure matters more than a perfect answer.</p><button type="button" onClick={() => window.dispatchEvent(new Event('careerpilot:open-coach'))}>Ask CareerPilot for a tip <FiArrowRight /></button></div></aside>
      <main className="practice-answer-column">
        {isSessionComplete ? <section className="practice-finish-card panel-card"><span className="practice-finish-icon"><FiCheckCircle /></span><span className="eyebrow">PRACTICE COMPLETE</span><h3>You have worked through every question.</h3><p>Review the feedback below, then use what you learned in your next real conversation.</p><div className="practice-finish-actions"><button type="button" className="interview-primary-button" onClick={() => setStatus(session.status === 'completed' ? 'active' : 'completed')} disabled={working}>{session.status === 'completed' ? 'Reopen session' : 'Mark session complete'} <FiCheck /></button><Link to="/applications">Review your applications <FiArrowRight /></Link></div></section> : null}
        {currentQuestion ? <section className="practice-question-card panel-card"><div className="practice-question-topline"><span>QUESTION {currentIndex + 1} OF {questions.length}</span><span>{currentSavedAnswer ? 'ANSWER SAVED' : 'YOUR TURN'}</span></div><div className="practice-question-labels"><span>{currentQuestionMetadata.category || currentQuestion.question_type || 'Interview question'}</span><span>{currentQuestionMetadata.type || 'Practice'}</span><span className="difficulty-label">{currentQuestionMetadata.difficulty || 'Difficulty not recorded'}</span></div>{currentQuestionMetadata.skills?.length ? <div className="practice-question-skills" aria-label="Skills covered">{currentQuestionMetadata.skills.map((skill) => <span key={skill}>{skill}</span>)}</div> : null}<h3>{currentQuestion.question_text}</h3>
          {currentSavedAnswer ? <div className="practice-saved-answer"><div><strong>Your answer</strong><span>{currentSavedAnswer.answer_text}</span></div>{currentSavedAnswer.ai_feedback ? <div className="practice-feedback"><strong><FiMessageCircle /> Answer feedback</strong><p>{currentSavedAnswer.ai_feedback}</p></div> : <p className="practice-no-feedback">Feedback is not available for this answer. Your response is saved.</p>}<button type="button" className="practice-secondary-button" onClick={continuePractice}><FiArrowRight /> Continue to next question</button></div> : <form onSubmit={submitAnswer} className="practice-answer-form"><label htmlFor="practice-answer">Your answer</label><textarea id="practice-answer" value={answer} onChange={(e) => setAnswer(e.target.value)} maxLength={12000} rows={9} placeholder="Use a real example. For behavioral questions, explain the situation, what you did, and the result." /><div className="practice-answer-footer"><span>{answer.length}/12,000 characters · With live AI enabled, your answer is sent to the configured provider. Otherwise, CareerPilot uses a simple local answer-structure rubric.</span><button type="submit" className="interview-primary-button" disabled={working || answer.trim().length < 5}>{working ? 'Reviewing answer…' : 'Save and get feedback'} <FiSend /></button></div></form>}
        </section> : null}
        {questions.some((question) => answerFor(answers, question.id)) ? <section className="practice-review-list"><h3>Answer review</h3>{questions.filter((question) => answerFor(answers, question.id) && question.id !== currentQuestion?.id).map((question) => { const saved = answerFor(answers, question.id); return <article className="practice-review-item panel-card" key={question.id}><button type="button" onClick={() => setCurrentIndex(questions.indexOf(question))}><span>Q{questions.indexOf(question) + 1}</span>{question.question_text}<FiRotateCcw /></button>{saved.ai_feedback ? <p>{saved.ai_feedback}</p> : <p>Your response is saved. AI feedback is unavailable.</p>}</article>; })}</section> : null}
      </main>
    </div>}
  </div>;
}
