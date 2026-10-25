import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig, Sequence } from "remotion";
import React from "react";
import vocabStagesArtifact from "../../data/roadmap/vocab-stages-v1.json";

const ElegantLessonCard = ({ lesson, delay }: { lesson: string, delay: number }) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame - delay, [0, 15], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const translateY = interpolate(frame - delay, [0, 15], [20, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const sweepCycle = frame % 90;
  const sweepLeft = interpolate(sweepCycle, [0, 45, 90], [-100, 200, 200], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <div style={{
      height: 120,
      margin: "15px 20px",
      backgroundColor: "rgba(255, 255, 255, 0.75)",
      borderRadius: "16px",
      border: "1px solid rgba(255, 255, 255, 0.8)",
      display: "flex",
      flexDirection: "row",
      alignItems: "center",
      position: "relative",
      overflow: "hidden",
      boxShadow: "0 10px 20px -5px rgba(0,0,0,0.08)",
      opacity,
      transform: `translateY(${translateY}px)`
    }}>
      {/* Light sweep effect */}
      <div style={{
        position: "absolute",
        top: 0,
        left: `${sweepLeft}%`,
        width: "50%",
        height: "100%",
        background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.8), transparent)",
        transform: "skewX(-20deg)"
      }} />
      
      <div style={{
        width: 40,
        height: 40,
        backgroundColor: "#fff",
        borderRadius: "50%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
        marginLeft: 20,
        flexShrink: 0
      }}>
        <div style={{
          width: 0,
          height: 0,
          borderTop: "8px solid transparent",
          borderBottom: "8px solid transparent",
          borderLeft: "12px solid #3b82f6",
          marginLeft: 4
        }} />
      </div>
      <div style={{
        padding: "0 20px",
        color: "#1e293b",
        fontSize: 22,
        fontWeight: "bold",
        textAlign: "left",
        flex: 1
      }}>
        {lesson}
      </div>
    </div>
  );
};

export const StyleThree: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const introOpacity = interpolate(frame, [100, 110], [1, 0], { extrapolateRight: "clamp" });
  const cinematicZoom = interpolate(frame, [0, 300], [1, 1.15]);
  const textFadeIn = interpolate(frame, [0, 30], [0, 1], { extrapolateRight: "clamp" });
  const textSlideUp = interpolate(frame, [0, 40], [50, 0], { extrapolateRight: "clamp" });

  const slideAnim = spring({ fps, frame: frame - 110, config: { damping: 20, mass: 1.2 } });
  
  // Total frames: 300. Start columns at 110. Let's make scrolling smoother.
  const scrollY = interpolate(frame, [140, 300], [0, -1100], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });

  const stages = vocabStagesArtifact.stages.slice(0, 3);

  return (
    <AbsoluteFill style={{ backgroundColor: "#020617", color: "#f8fafc", fontFamily: "Georgia, serif", overflow: "hidden" }}>
      {/* Cinematic animated background */}
      <AbsoluteFill style={{ 
        backgroundImage: "radial-gradient(circle at center, #1e293b 0%, #020617 100%)", 
        transform: `scale(${cinematicZoom})` 
      }} />

      {/* Floating particles/glows effect */}
      <AbsoluteFill style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
        <div style={{
          position: "absolute",
          width: "150%",
          height: "150%",
          background: "radial-gradient(circle, rgba(56,189,248,0.15) 0%, transparent 60%)",
          transform: `rotate(${frame * 0.1}deg) scale(${1 + Math.sin(frame * 0.05) * 0.2})`,
        }} />
      </AbsoluteFill>

      <Sequence from={0} durationInFrames={110}>
        <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", opacity: introOpacity }}>
          <div style={{ opacity: textFadeIn, transform: `translateY(${textSlideUp}px)`, textAlign: "center", maxWidth: "80%" }}>
            <h1 style={{ fontSize: 60, fontWeight: "normal", lineHeight: 1.5, color: "#cbd5e1" }}>
              Đọc hiểu được <i style={{ color: "#38bdf8" }}>&gt;80% nội dung tiếng Anh</i><br />
              với lộ trình <br/>
              <span style={{ fontSize: 95, color: "#fff", fontWeight: "bold", textShadow: "0 0 40px rgba(56,189,248,0.5)" }}>3000 từ vựng</span>
            </h1>
          </div>
        </AbsoluteFill>
      </Sequence>

      <Sequence from={110} durationInFrames={190}>
        <AbsoluteFill style={{ flexDirection: "row", justifyContent: "center", alignItems: "center", gap: "3%" }}>
          {stages.map((stage, colIndex) => {
            const appearY = interpolate(slideAnim, [0, 1], [300, 0]);

            return (
              <div
                key={colIndex}
                style={{
                  width: "28%",
                  height: "85%",
                  display: "flex",
                  flexDirection: "column",
                  opacity: slideAnim,
                  transform: `translateY(${appearY}px)`, // Straight slide up (no ziczac)
                  position: "relative",
                  background: "linear-gradient(180deg, rgba(30, 41, 59, 0.8) 0%, rgba(15, 23, 42, 0.9) 100%)",
                  backdropFilter: "blur(24px)",
                  border: "1px solid rgba(255, 255, 255, 0.15)",
                  borderRadius: "28px",
                  boxShadow: "0 30px 60px -12px rgba(0, 0, 0, 0.5), 0 0 40px rgba(56,189,248,0.1) inset",
                  overflow: "hidden"
                }}
              >
                {/* Header for the column */}
                <div style={{
                  padding: "25px",
                  background: "linear-gradient(90deg, rgba(56,189,248,0.1), rgba(59,130,246,0.1))",
                  textAlign: "center",
                  zIndex: 10,
                  borderBottom: "1px solid rgba(255,255,255,0.1)",
                  boxShadow: "0 10px 30px rgba(0,0,0,0.2)"
                }}>
                  <div style={{ fontSize: 20, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 2 }}>{stage.titleVi.split(':')[0]}</div>
                  <div style={{ fontSize: 32, fontWeight: "bold", color: "#fff", marginTop: 8, textShadow: "0 2px 10px rgba(0,0,0,0.5)" }}>
                    {stage.titleVi.split(':')[1]?.trim() || stage.title}
                  </div>
                  <div style={{ fontSize: 18, color: "#38bdf8", marginTop: 4, fontWeight: "500" }}>{stage.wordCount} Từ</div>
                </div>

                {/* Scrolling content */}
                <div style={{ position: "absolute", top: 140, left: 0, right: 0, transform: `translateY(${scrollY}px)` }}>
                  {stage.topics.map((topic: any, idx: number) => (
                    <ElegantLessonCard key={idx} lesson={topic.title} delay={110 + idx * 5} />
                  ))}
                </div>
                
                {/* Gradient overlay at bottom for smooth fade out */}
                <div style={{
                  position: "absolute",
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: 150,
                  background: "linear-gradient(to top, rgba(15,23,42,1), transparent)",
                  zIndex: 20,
                  pointerEvents: "none"
                }} />
              </div>
            );
          })}
        </AbsoluteFill>
      </Sequence>
    </AbsoluteFill>
  );
};
