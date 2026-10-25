import { Composition, getInputProps } from "remotion";
import { StyleOne } from "./styles/StyleOne";
import { StyleTwo } from "./styles/StyleTwo";
import { StyleThree } from "./styles/StyleThree";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="VocabPromoStyleOne"
        component={StyleOne}
        durationInFrames={300}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="VocabPromoStyleTwo"
        component={StyleTwo}
        durationInFrames={300}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="VocabPromoStyleThree"
        component={StyleThree}
        durationInFrames={300}
        fps={30}
        width={1920}
        height={1080}
      />
    </>
  );
};
