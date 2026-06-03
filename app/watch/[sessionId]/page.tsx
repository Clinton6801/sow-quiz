'use client'
import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import { supabase } from '../../../lib/supabase'
import styles from './page.module.css'

interface QuizEvent {
  event: string
  payload: any
  timestamp: number
}

export default function WatchPage({ params }: { params: { sessionId: string } }) {
  const [quizStarted, setQuizStarted] = useState(false)
  const [currentQuestion, setCurrentQuestion] = useState<any>(null)
  const [scores, setScores] = useState<any[]>([])
  const [section, setSection] = useState<string>('')
  const [teams, setTeams] = useState<any[]>([])
  const [quizEnded, setQuizEnded] = useState(false)
  const [finalScores, setFinalScores] = useState<any[]>([])
  const [activity, setActivity] = useState<QuizEvent[]>([])
  const [reconnecting, setReconnecting] = useState(false)
  const channelRef = useRef<any>(null)
  const reconnectIntervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (!params.sessionId) return

    const setupChannel = () => {
      const channel = supabase.channel(`solo:${params.sessionId}`)
      channelRef.current = channel

      channel
        .on('broadcast', { event: 'quiz_started' }, (payload) => {
          setQuizStarted(true)
          setSection(payload.payload.section)
          setTeams(payload.payload.teams)
          setReconnecting(false)
          addActivity({
            event: 'quiz_started',
            payload: payload.payload,
            timestamp: Date.now(),
          })
        })
        .on('broadcast', { event: 'question' }, (payload) => {
          setCurrentQuestion(payload.payload)
          addActivity({
            event: 'question',
            payload: payload.payload,
            timestamp: Date.now(),
          })
        })
        .on('broadcast', { event: 'correct' }, (payload) => {
          addActivity({
            event: 'correct',
            payload: payload.payload,
            timestamp: Date.now(),
          })
          flashScore(payload.payload.teamName, 'correct')
        })
        .on('broadcast', { event: 'incorrect' }, (payload) => {
          addActivity({
            event: 'incorrect',
            payload: payload.payload,
            timestamp: Date.now(),
          })
          flashScore(payload.payload.teamName, 'incorrect')
        })
        .on('broadcast', { event: 'round_change' }, (payload) => {
          addActivity({
            event: 'round_change',
            payload: payload.payload,
            timestamp: Date.now(),
          })
        })
        .on('broadcast', { event: 'scores' }, (payload) => {
          setScores(payload.payload.scores)
        })
        .on('broadcast', { event: 'quiz_ended' }, (payload) => {
          setQuizEnded(true)
          setFinalScores(payload.payload.finalScores)
          addActivity({
            event: 'quiz_ended',
            payload: payload.payload,
            timestamp: Date.now(),
          })
        })
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            setReconnecting(false)
            if (reconnectIntervalRef.current) {
              clearInterval(reconnectIntervalRef.current)
            }
          }
        })
    }

    setupChannel()

    return () => {
      if (channelRef.current) {
        channelRef.current.unsubscribe()
      }
      if (reconnectIntervalRef.current) {
        clearInterval(reconnectIntervalRef.current)
      }
    }
  }, [params.sessionId])

  const addActivity = (event: QuizEvent) => {
    setActivity((prev) => {
      const updated = [event, ...prev]
      return updated.slice(0, 5)
    })
  }

  const flashScore = (teamName: string, type: 'correct' | 'incorrect') => {
    // Visual feedback is handled in the scoreRow animation
  }

  const getCategoryBadgeClass = (category: string) => {
    if (category === 'Spelling Bee') return styles.spellingBee
    if (category === 'General Knowledge') return styles.genKnowledge
    return ''
  }

  const getCategoryIcon = (category: string) => {
    if (category === 'Maths') return '📐'
    if (category === 'Spelling Bee') return '🐝'
    return '🌍'
  }

  if (!quizStarted) {
    return (
      <div className={styles.waitingScreen}>
        <div className={styles.waitingLogo}>
          <div style={{ width: '100%', height: '100%', background: '#0f1535', borderRadius: '8px' }} />
        </div>
        <h1 className={styles.waitingTitle}>Get ready...</h1>
        <p style={{ fontSize: '1.2rem', marginBottom: '30px' }}>the quiz is about to begin</p>
        <div className={styles.waitingPulseAnimation}>✨</div>
      </div>
    )
  }

  if (quizEnded) {
    return (
      <div className={styles.wrap}>
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <div className={styles.logo} style={{ background: '#0f1535' }} />
            <div className={styles.headerInfo}>
              <h1>SOW Quiz Championship — Live</h1>
              <div className={styles.sectionAndLive}>
                <span className={styles.sectionName}>{section}</span>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.endScreen}>
          <h2 className={styles.endTitle}>Quiz Complete!</h2>
          <div className={styles.podium}>
            {finalScores.slice(0, 3).map((score, i) => (
              <div key={i} className={styles.podiumPlace}>
                <div className={styles.podiumMedal}>
                  {i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'}
                </div>
                <div className={styles.podiumName} style={{ color: score.color }}>
                  {score.name}
                </div>
                <div className={styles.podiumScore}>{score.score} pts</div>
              </div>
            ))}
          </div>
          <p style={{ marginTop: '20px', color: '#ccc' }}>
            This quiz has ended. Refresh the page if you want to watch another session.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.wrap}>
      {reconnecting && (
        <div className={styles.reconnectingBanner}>
          ⚠ Reconnecting to live feed...
        </div>
      )}

      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.logo} style={{ background: '#0f1535' }} />
          <div className={styles.headerInfo}>
            <h1>SOW Quiz Championship — Live</h1>
            <div className={styles.sectionAndLive}>
              <span className={styles.sectionName}>{section}</span>
              <div className={styles.liveBadge}>
                <div className={styles.pulse} />
                <span>LIVE</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.main}>
        <div className={styles.questionArea}>
          {currentQuestion ? (
            <div className={styles.questionCard}>
              <div className={styles.questionNumber}>
                Question {currentQuestion.questionNumber} of {currentQuestion.total}
              </div>
              <h2 className={styles.questionText}>{currentQuestion.question}</h2>
              <span className={`${styles.categoryBadge} ${getCategoryBadgeClass(currentQuestion.category)}`}>
                {getCategoryIcon(currentQuestion.category)} {currentQuestion.category}
              </span>
            </div>
          ) : (
            <div className={styles.questionCard}>
              <div className={styles.waitingPulse}>waiting for next question...</div>
            </div>
          )}

          <div className={styles.activityFeed}>
            <h3 className={styles.activityTitle}>Activity</h3>
            {activity.length === 0 ? (
              <p style={{ color: '#999', fontSize: '0.9rem' }}>Waiting for events...</p>
            ) : (
              activity.map((event, i) => (
                <div key={i} className={styles.activityEntry}>
                  {event.event === 'correct' && (
                    <>✅ {event.payload.teamName} answered correctly — +{event.payload.points} pts</>
                  )}
                  {event.event === 'incorrect' && (
                    <>❌ {event.payload.teamName} answered incorrectly</>
                  )}
                  {event.event === 'round_change' && (
                    <>⚡ Round changed to {event.payload.roundName}</>
                  )}
                  {event.event === 'question' && (
                    <>📝 New question: {event.payload.category}</>
                  )}
                  {event.event === 'quiz_started' && (
                    <>🎯 Quiz started in {event.payload.section}</>
                  )}
                  {event.event === 'quiz_ended' && (
                    <>🏁 Quiz ended</>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        <div className={styles.scoreboard}>
          <h3 className={styles.scoreTitle}>🏆 Scores</h3>
          {scores.length === 0 ? (
            <p style={{ color: '#999', fontSize: '0.9rem' }}>Waiting for teams...</p>
          ) : (
            scores.map((score, i) => (
              <div
                key={i}
                className={styles.scoreRow}
                style={{ borderLeftColor: score.color }}
              >
                <span className={styles.scoreName} style={{ color: score.color }}>
                  {score.name}
                </span>
                <span className={styles.scoreValue} style={{ color: score.color }}>
                  {score.score}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
