import { memo } from "react";
import { playSound } from "../../utils/soundEffects.js";

const Review = ({ review }) => {
      const authorDetails = review?.author_details || {};
      const author = String(
            review?.author || authorDetails.name || authorDetails.username || "Anonymous viewer"
      );

      const initials = author
            .trim()
            .split(/\s+/)
            .slice(0, 2)
            .map((part) => part.charAt(0))
            .join("")
            .toUpperCase();

      const dateValue = review?.updated_at || review?.created_at;
      const parsedDate = dateValue ? new Date(dateValue) : null;

      const reviewDate = parsedDate && !Number.isNaN(parsedDate.getTime())
            ? new Intl.DateTimeFormat(undefined, {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
            }).format(parsedDate)
            : "Date unavailable";

      const content = typeof review?.content === "string"
            ? review.content
                  .replace(/<[^>]*>/g, " ")
                  .replace(/[\r\n\t]+/g, " ")
                  .replace(/\s+/g, " ")
                  .trim()
            : "";

      const rating = authorDetails.rating;
      const hasRating = rating !== null &&
            rating !== undefined &&
            rating !== "" &&
            Number.isFinite(Number(rating));

      return (
            <article
                  className="mt-review-editorial"
                  aria-label={`Review by ${author}`}
                  onClick={() => {
                        if (!window.getSelection()?.toString()) {
                              playSound("review-focus");
                        }
                  }}
            >
                  <header className="mt-review-editorial__top">
                        <span className="mt-review-editorial__eyebrow">
                              <span className="mt-review-editorial__indicator" />
                              COMMUNITY REVIEW
                        </span>

                        <div className={`mt-review-editorial__score ${hasRating ? "" : "is-unrated"}`}>
                              {hasRating ? (
                                    <>
                                          <span className="mt-review-editorial__star" aria-hidden="true">★</span>
                                          <strong>{Number(rating).toFixed(1)}</strong>
                                          <span className="mt-review-editorial__scale">/ 10</span>
                                    </>
                              ) : (
                                    <span>NO RATING</span>
                              )}
                        </div>
                  </header>

                  <div className="mt-review-editorial__meta">
                        <span>THE VIEWER&apos;S TAKE</span>
                        <time dateTime={dateValue || undefined}>{reviewDate}</time>
                  </div>

                  <div className="mt-review-editorial__body">
                        <span className="mt-review-editorial__quote" aria-hidden="true">“</span>
                        <p>{content || "No written review was provided."}</p>
                  </div>

                  <footer className="mt-review-editorial__footer">
                        <span className="mt-review-editorial__avatar" aria-hidden="true">
                              {initials || "U"}
                        </span>

                        <div className="mt-review-editorial__identity">
                              <strong>{author}</strong>
                              {authorDetails.username && authorDetails.username !== author && (
                                    <span>@{authorDetails.username}</span>
                              )}
                        </div>

                        <span className="mt-review-editorial__signature">
                              MTSTREAMS
                        </span>
                  </footer>
            </article>
      );
};

export default memo(Review);