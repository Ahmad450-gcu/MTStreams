import { Link } from "react-router-dom";
import "./franchise.css";

/** Shown on a movie's details page when TMDB lists it as part of a collection. */
export default function FranchiseLink({ collection }) {
      if (!collection?.id) return null;
      return (
            <Link to={`/franchise/${collection.id}`} className="frn-link">
                  Part of the <strong>{collection.name.replace(/ Collection$/, "")}</strong> series →
            </Link>
      );
}
