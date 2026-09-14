import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig, Sequence } from "remotion";
import React from "react";
import { SCROLLING_LESSONS } from "./shared";

const LessonCard = ({ lesson, colorTheme }: { lesson: string, colorTheme: string }) => (
  <div style={{
    height: 220,
    margin: "20px",
    backgroundColor: colorTheme,
    borderRadius: "16px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "flex-end",
    position: "relative",
    overflow: "hidden",
    boxShadow: "0 10px 15px -3px rgba(0,0,0,0.3)"
  }}>
    <div style={{
      position: "absolute",
      top: "50%",
      left: "50%",
      transform: "translate(-50%, -50%)",
      width: 60,
      height: 60,
      backgroundColor: "rgba(255,255,255,0.8)",
      borderRadius: "50%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center"
    }}>
      <div style={{
        width: 0,
        height: 0,
        borderTop: "15px solid transparent",
        borderBottom: "15px solid transparent",
        borderLeft: "24px solid #0f172a",
        marginLeft: 8
      }} />
    </div>
    <div style={{
      padding: "15px",
      backgroundColor: "rgba(0,0,0,0.6)",
      color: "#fff",
      fontSize: 26,
      fontWeight: "bold",
      textAlign: "center"
    }}>
      {lesson}
    </div>
  </div>
);

export const StyleOne: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const introScale = spring({ fps, frame, config: { damping: 12 } });
  const introOpacity = interpolate(frame, [100, 110], [1, 0], { extrapolateRight: "clamp" });
  
  const splitAnim = spring({ fps, frame: frame - 110, config: { damping: 14 } });
  const scrollY = interpolate(frame, [110, 300], [0, -2800], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ backgroundColor: "#0f172a", color: "white", fontFamily: "sans-serif" }}>
      {/* Intro Phase */}
      <Sequence from={0} durationInFrames={110}>
        <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", opacity: introOpacity }}>
          <h1 style={{ fontSize: 80, fontWeight: "bold", textAlign: "center", maxWidth: "80%", transform: `scale(${introScale})` }}>
            <span style={{ color: "#38bdf8" }}>Đọc hiểu được &gt;80%</span> nội dung tiếng Anh<br />
            với lộ trình <span style={{ color: "#facc15", fontSize: 100 }}>3000 từ vựng</span>
          </h1>
        </AbsoluteFill>
      </Sequence>

      {/* 3 Columns Split Phase */}
      <Sequence from={110} durationInFrames={190}>
        <AbsoluteFill style={{ flexDirection: "row", justifyContent: "space-evenly", alignItems: "center", padding: "50px" }}>
          {[0, 1, 2].map((colIndex) => {
            const translateX = colIndex === 0 ? interpolate(splitAnim, [0, 1], [400, 0]) :
                               colIndex === 2 ? interpolate(splitAnim, [0, 1], [-400, 0]) : 0;
            
            return (
              <div
                key={colIndex}
                style={{
                  width: "28%",
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  opacity: splitAnim,
                  transform: `translateX(${translateX}px) scale(${interpolate(splitAnim, [0, 1], [0.8, 1])})`,
                  overflow: "hidden",
                  position: "relative",
                  backgroundColor: "#1e293b",
                  borderRadius: "24px",
                  boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.5)",
                }}
              >
                <div style={{
                  padding: "20px",
                  backgroundColor: "#0ea5e9",
                  width: "100%",
                  textAlign: "center",
                  fontSize: 40,
                  fontWeight: "bold",
                  zIndex: 10,
                  boxShadow: "0 10px 15px -3px rgba(0,0,0,0.3)"
                }}>
                  1000 TỪ
                </div>
                <div style={{ position: "absolute", top: 100, left: 0, right: 0, transform: `translateY(${scrollY}px)` }}>
                  {SCROLLING_LESSONS.map((lesson, idx) => (
                    <LessonCard key={idx} lesson={lesson} colorTheme={["#334155", "#475569", "#64748b"][idx % 3]} />
                  ))}
                </div>
              </div>
            );
          })}
        </AbsoluteFill>
      </Sequence>
    </AbsoluteFill>
  );
};
