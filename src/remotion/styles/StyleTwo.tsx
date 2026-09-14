import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig, Sequence } from "remotion";
import React from "react";
import { SCROLLING_LESSONS } from "./shared";

const NeonLessonCard = ({ lesson }: { lesson: string }) => (
  <div style={{
    height: 220,
    margin: "20px",
    backgroundColor: "rgba(20, 0, 30, 0.8)",
    border: "2px solid rgba(0, 255, 204, 0.5)",
    borderRadius: "16px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "flex-end",
    position: "relative",
    overflow: "hidden",
    boxShadow: "0 0 20px rgba(0, 255, 204, 0.2)"
  }}>
    <div style={{
      position: "absolute",
      top: "50%",
      left: "50%",
      transform: "translate(-50%, -50%)",
      width: 60,
      height: 60,
      backgroundColor: "rgba(0, 255, 204, 0.2)",
      border: "2px solid #00ffcc",
      borderRadius: "50%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      boxShadow: "0 0 15px #00ffcc"
    }}>
      <div style={{
        width: 0,
        height: 0,
        borderTop: "15px solid transparent",
        borderBottom: "15px solid transparent",
        borderLeft: "24px solid #00ffcc",
        marginLeft: 8
      }} />
    </div>
    <div style={{
      padding: "15px",
      backgroundColor: "rgba(0,0,0,0.8)",
      color: "#fff",
      fontSize: 26,
      fontWeight: "bold",
      textAlign: "center",
      textShadow: "0 0 5px #00ffcc"
    }}>
      {lesson}
    </div>
  </div>
);

export const StyleTwo: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const introOpacity = interpolate(frame, [100, 110], [1, 0], { extrapolateRight: "clamp" });
  const introBlur = interpolate(frame, [0, 20], [20, 0], { extrapolateRight: "clamp" });
  const textScale = spring({ fps, frame, config: { damping: 10, mass: 0.5 } });

  const splitAnim = spring({ fps, frame: frame - 110, config: { damping: 15 } });
  const scrollY = interpolate(frame, [110, 300], [0, -2800], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ backgroundColor: "#000000", color: "#fff", fontFamily: "sans-serif" }}>
      <AbsoluteFill style={{ background: "radial-gradient(circle at center, #2d004d 0%, #000 70%)", opacity: 0.8 }} />

      <Sequence from={0} durationInFrames={110}>
        <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", opacity: introOpacity, filter: `blur(${introBlur}px)` }}>
          <h1 style={{
            fontSize: 70, fontWeight: "900", textAlign: "center", maxWidth: "85%",
            transform: `scale(${textScale})`, textTransform: "uppercase", lineHeight: 1.2
          }}>
            <span style={{ color: "#fff", textShadow: "0 0 20px #e02fe9" }}>Đọc hiểu được &gt;80%</span><br />
            <span style={{ fontSize: 50, color: "#ccc" }}>nội dung tiếng Anh với lộ trình</span><br />
            <span style={{ color: "#00ffcc", fontSize: 120, textShadow: "0 0 40px #00ffcc, 0 0 80px #00ffcc" }}>3000 TỪ VỰNG</span>
          </h1>
        </AbsoluteFill>
      </Sequence>

      <Sequence from={110} durationInFrames={190}>
        <AbsoluteFill style={{ flexDirection: "row", justifyContent: "center", alignItems: "center", perspective: "1200px" }}>
          {[0, 1, 2].map((colIndex) => {
            const rotateY = colIndex === 0 ? 25 : colIndex === 2 ? -25 : 0;
            const translateZ = colIndex === 1 ? 100 : 0;
            const translateX = colIndex === 0 ? interpolate(splitAnim, [0, 1], [400, 0]) :
                               colIndex === 2 ? interpolate(splitAnim, [0, 1], [-400, 0]) : 0;

            return (
              <div
                key={colIndex}
                style={{
                  width: "25%",
                  height: "85%",
                  margin: "0 2%",
                  display: "flex",
                  flexDirection: "column",
                  opacity: splitAnim,
                  transform: `translateX(${translateX}px) scale(${splitAnim}) rotateY(${rotateY}deg) translateZ(${translateZ}px)`,
                  position: "relative",
                  backgroundColor: "rgba(20, 0, 30, 0.6)",
                  border: "2px solid #e02fe9",
                  borderRadius: "20px",
                  boxShadow: "0 0 30px rgba(224, 47, 233, 0.4)",
                  overflow: "hidden"
                }}
              >
                <div style={{
                  padding: "20px",
                  background: "linear-gradient(90deg, #e02fe9, #00ffcc)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  textAlign: "center",
                  fontSize: 50,
                  fontWeight: "900",
                  zIndex: 10,
                  borderBottom: "1px solid #333",
                  backgroundColor: "#000"
                }}>
                  1000 TỪ
                </div>
                <div style={{ position: "absolute", top: 120, left: 0, right: 0, transform: `translateY(${scrollY}px)` }}>
                  {SCROLLING_LESSONS.map((lesson, idx) => (
                    <NeonLessonCard key={idx} lesson={lesson} />
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
