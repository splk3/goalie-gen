import * as React from "react";
import { withPrefix } from "gatsby";
import Seo from "../components/SEO";
import AboutPage from "../components/AboutPage";
import DrillMarkdown from "../components/DrillMarkdown";
import DownloadMaterialButton from "../components/DownloadMaterialButton";
import implementationInfoMd from "../content/about/fundamental-skills-and-good-drill-design/goalie-development-implementation-info.md";
import sampleDrillsMd from "../content/about/fundamental-skills-and-good-drill-design/sample-drills-and-good-drill-design.md";
import { buildCacheBustedAssetPath } from "../utils/staticAsset";

const implementationDiagrams = [
  {
    src: "/images/drill-design/goaltending-skills-cycle.png",
    alt: "Goaltending skills cycle diagram",
    caption: (
      <>
        <strong className="block">The Goaltending Skills Cycle</strong>
        <p className="mt-2">If each spoke is strong, the goalie will be successful.</p>
        <p>
          Every save starts with the goalie&apos;s stance, skating to follow the play, and
          maintaining strong positioning.
        </p>
        <p>
          Angle, Depth, and Square. If in a good position, the goalie can make the save, control the
          rebound, and recover back into a strong stance.
        </p>
      </>
    ),
  },
  {
    src: "/images/drill-design/goaltending-skills-pyramid.png",
    alt: "Goaltending skills pyramid diagram",
    caption: (
      <>
        <strong className="block">The Goaltending Skills Pyramid</strong>
        <p className="mt-2">
          Each of the fundamental skills of goaltending builds upon the others.
        </p>
        <p>
          When coaching your goalies, try to build the goalie by building the athlete, from the
          foundation up.
        </p>
        <p>Each stage cannot be learned until the goalie is strong in the ones below it.</p>
      </>
    ),
  },
  {
    src: "/images/drill-design/fundamental-skills-by-exp-1-movement.png",
    alt: "Fundamental goalie movement skills by experience level diagram",
    caption: (
      <>
        <strong className="block">Fundamental Skills by Experience: Movement</strong>
        <p className="mt-2">
          USA Hockey recommended skating and movement skills focus, based on years of goalie
          experience.
        </p>
        <p className="mt-4">
          <strong>NOTE:</strong> This diagram is meant as a starting point and guide. All goalies
          are different and will develop at their own pace. Make appropriate adjustments to your
          plans and expectations, as needed.
        </p>
      </>
    ),
    fullWidth: true,
  },
  {
    src: "/images/drill-design/fundamental-skills-by-exp-2-saves.png",
    alt: "Fundamental goalie save skills by experience level diagram",
    caption: (
      <>
        <strong className="block">Fundamental Skills by Experience: Saves</strong>
        <p className="mt-2">
          USA Hockey recommended skills for different save types, controlling rebounds, and
          recovering after shots, based on years of goalie experience.
        </p>
        <p className="mt-4">
          <strong>NOTE:</strong> This diagram is meant as a starting point and guide. All goalies
          are different and will develop at their own pace. Make appropriate adjustments to your
          plans and expectations, as needed.
        </p>
      </>
    ),
    fullWidth: true,
  },
];

const drillDesignImages = [
  {
    src: "/images/drill-design/usah-elements-good-drill-design.png",
    alt: "USA Hockey five elements of good drill design diagram",
    caption: (
      <>
        <p>Practice the 5 elements of good drill design. Quality drills should:</p>
        <ul className="list-disc pl-6 mt-2 space-y-1">
          <li>require constant decision making.</li>
          <li>provide quality repetitions (quick resets and short reps)</li>
          <li>look like the game</li>
          <li>provide a challenge for players</li>
          <li>
            <strong>BE FUN!</strong>
          </li>
        </ul>
      </>
    ),
  },
  {
    src: "/images/drill-design/usah-drill-design-continuum.png",
    alt: "USA Hockey drill design continuum from unopposed practice to game-like play",
    caption: (
      <p>
        When introducing new concepts, whether for players or goalies, start with the technical
        emphasis in unopposed practice. As the skill is learned, add players and complexity until
        the drills look more and more like the game, developing the implementation of the skill and
        tactical use.
      </p>
    ),
  },
];

export default function FundamentalSkillsAndGoodDrillDesign() {
  return (
    <AboutPage
      title="Fundamental Skills and Good Drill Design"
      subtitle="Explore foundational goaltending skills and practical drill-design guidance to support effective team development."
      showComingSoonNotice={false}
      sections={[
        {
          heading: "Fundamental Skills of Goaltending",
          content: (
            <div className="space-y-6">
              <DrillMarkdown
                markdown={implementationInfoMd}
                className="text-gray-700 dark:text-gray-300 space-y-4"
              />
              <div className="grid gap-6 md:grid-cols-2">
                {implementationDiagrams.map((item) => (
                  <figure
                    key={item.src}
                    className={`bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg p-4 ${
                      item.fullWidth ? "md:col-span-2" : ""
                    }`}
                  >
                    <img
                      src={withPrefix(buildCacheBustedAssetPath(item.src))}
                      alt={item.alt}
                      className="w-full h-auto rounded-md border border-gray-300 dark:border-gray-600"
                      loading="lazy"
                    />
                    <figcaption className="mt-3 text-sm text-gray-700 dark:text-gray-300">
                      {item.caption}
                    </figcaption>
                  </figure>
                ))}
              </div>
            </div>
          ),
        },
        {
          heading: "Coach Z's Zone Map",
          content: (
            <div className="space-y-6">
              <p>
                Use this handy zone map to help teach your goalies where to be with respect to the
                puck location. Use the crease map to show where the goalie&apos;s feet should be in
                each part of the zone, and how to transition in and out of the post, and how to
                manage depth.
              </p>
              <figure className="bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <img
                  src={withPrefix(
                    buildCacheBustedAssetPath("/images/about/goalie-journals/coach-z-zone-map.png")
                  )}
                  alt="Coach Z's goalie crease zone map"
                  className="w-full h-auto rounded-md border border-gray-300 dark:border-gray-600"
                  loading="lazy"
                />
                <figcaption className="mt-3 text-sm text-gray-700 dark:text-gray-300">
                  Special thanks to John &quot;Coach Z&quot; Zdunkiewicz at ztending.com for sharing
                  his Zone Map
                </figcaption>
              </figure>
              <DownloadMaterialButton
                title="Download Coach Z's Zone Map"
                fileName="coach-z-zone-map.pdf"
                folder="diagrams"
              />
            </div>
          ),
        },
        {
          heading: "Elements of Good Drill Design",
          content: (
            <div className="space-y-6">
              <DrillMarkdown
                markdown={sampleDrillsMd}
                className="text-gray-700 dark:text-gray-300 space-y-4"
              />
              <div className="grid gap-6 md:grid-cols-2">
                {drillDesignImages.map((item) => (
                  <figure
                    key={item.src}
                    className="bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                  >
                    <img
                      src={withPrefix(buildCacheBustedAssetPath(item.src))}
                      alt={item.alt}
                      className="w-full h-auto rounded-md border border-gray-300 dark:border-gray-600"
                      loading="lazy"
                    />
                    <figcaption className="mt-3 text-sm text-gray-700 dark:text-gray-300">
                      {item.caption}
                    </figcaption>
                  </figure>
                ))}
              </div>
            </div>
          ),
        },
      ]}
    />
  );
}

export const Head = () => <Seo title="Fundamental Skills and Good Drill Design" />;
