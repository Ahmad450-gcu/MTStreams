Store search position checker for MTStreams (and MoviesFlix as a reference).
Uses the same public Microsoft Store catalogue search service as the Store app. Only reads; never signs in.
It checks the first 100 results (the service's maximum), so "-" means "not in the top 100".

Run (Python 3, no extra packages):
  python rank.py PK,IN,US,GB "movies" "free movies" "stream movies" "movie streaming" "netflix" "tv shows" "watch movies" "tv series" "web series" "movie trailers" "mtstreams"

Append the output to history.txt each week so trends are visible.
