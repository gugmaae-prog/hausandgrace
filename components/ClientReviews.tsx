const reviews = [
  {
    name: "Karen Noronha",
    quote: "From the beginning, Irfan was transparent, clear and extremely organised with every step of the rental process. His professionalism and attention to detail truly set him apart.",
  },
  {
    name: "Clayton Pereira",
    quote: "Irfan consistently answered my calls, even on weekends, and ensured every concern was handled quickly and professionally. Dedicated, responsive and genuinely caring.",
  },
  {
    name: "Rama Krishna Ayyagari",
    quote: "Mehul helped us find an off-plan property that fits our budget and payment plan. His calm and helpful approach made the process smooth and stress-free.",
  },
  {
    name: "Farrag",
    quote: "Priya guided me through every step, from viewing the apartment to finalising the facilities and paperwork. Her communication made everything smooth and stress-free.",
  },
  {
    name: "Rakesh Mohapatra",
    quote: "Urvashi explained Dubai real estate in a clear, professional and detailed manner. Her market knowledge and ability to simplify complex details made the process seamless.",
  },
  {
    name: "Haresh Gursahani",
    quote: "Mehul is a very honest and hard-working real estate professional. It has been an absolute pleasure working with him. Highly recommended.",
  },
];

const GOOGLE_REVIEWS = "https://maps.google.com/?cid=14327443386338087559";

export function ClientReviews({ compact = false }: { compact?: boolean }) {
  return <section className={`client-reviews section-pad${compact ? " compact" : ""}`}>
    <div className="client-reviews-heading">
      <div><p className="kicker">Client experience</p><h2>Service remembered<br /><em>for the right reasons.</em></h2></div>
      <div className="review-score"><strong>5.0</strong><span>58 five-star Google reviews</span><a href={GOOGLE_REVIEWS} target="_blank" rel="noreferrer">Read the review profile</a></div>
    </div>
    <div className="review-track" aria-label="Selected client reviews">{reviews.map((review) => <blockquote key={review.name}><p>&ldquo;{review.quote}&rdquo;</p><footer><strong>{review.name}</strong><span>Google review</span></footer></blockquote>)}</div>
  </section>;
}
