# Travel Domain System Testing Questions

This test suite contains 5 distinct questions covering multiple complexity levels and scenarios within the travel domain to evaluate system accuracy, retrieval grounding, and constraint satisfaction.

---

## Test Case 1: Factual Inquiry (Regulatory & Currency Limits)

* **Question:**
  > *"What is the maximum amount of foreign currency or cash an international traveler can bring into Indonesia without having to submit an official customs declaration or obtain prior central bank approval?"*

* **Complexity Level:** Low – Medium (Factual / Numerical Retrieval)
* **Test Objective:** Evaluate the system's ability to extract precise numerical thresholds, regulatory bodies (e.g., Bank Indonesia / Bea Cukai), and identify statutory reporting limits without hallucinating amounts.
* **Evaluation Criteria:**
  * Must specify the exact threshold (IDR 100,000,000 or equivalent in foreign currency requiring customs declaration; cash amounts exceeding IDR 1,000,000,000 requiring central bank permit).
  * Must not confuse declarations with outright bans.

---

## Test Case 2: Policy Edge-Case (Restricted Personal Medication)

* **Question:**
  > *"Can a traveler legally bring prescribed stimulant medication (such as methylphenidate or Adderall) into Japan for personal use during a 2-week vacation, and what advance permits or certificates are mandatory before departure?"*

* **Complexity Level:** High (Strict Policy & Compliance Edge-Case)
* **Test Objective:** Test safety guardrails, precision, and adherence to zero-tolerance narcotics/psychotropics regulations. Evaluate whether the system warns the user about strictly prohibited substances vs. those requiring import certificates (*Yakkan Shoumei / Yunyu Kakunin-sho*).
* **Evaluation Criteria:**
  * Must highlight that amphetamine-based medications (like Adderall) are strictly illegal in Japan even with a foreign prescription, whereas methylphenidate requires strict quantity limits and prior approval.
  * Must clearly point to mandatory advance application procedures and warning of severe penalties/detention.

---

## Test Case 3: Multi-Constraint Itinerary Recommendation

* **Question:**
  > *"Create a 3-day cultural and culinary itinerary in Yogyakarta specifically tailored for elderly travelers with limited mobility. Avoid steep stair climbs or rugged walking paths, include wheelchair-accessible spots, and suggest relaxed pacing with minimal transit times."*

* **Complexity Level:** High (Multi-Constraint Reasoning & Spatial Logic)
* **Test Objective:** Evaluate whether the model respects negative and physical constraints (elderly, low mobility, wheelchair accessibility, gentle pacing) rather than generating a generic tourist itinerary (e.g., climbing Borobudur's upper stone tiers or trekking Mount Merapi).
* **Evaluation Criteria:**
  * All recommended activities must be accessible (e.g., ground-level viewing, accessible batik workshops, Keraton ground courtyards, seated culinary experiences).
  * Timetable must feature realistic pacing with adequate rest periods and short travel distances.

---

## Test Case 4: Transit Logistics & Immigration Rules (Separate Tickets)

* **Question:**
  > *"I have a self-transfer layover of 7 hours between Terminal 2 and Terminal 4 at London Heathrow (LHR) booked on two separate airline tickets. Do I have to pass through UK Border Control to collect and re-check my luggage, and what type of transit visa is needed if my nationality is not visa-exempt?"*

* **Complexity Level:** Medium – High (Logistics & Visa Disambiguation)
* **Test Objective:** Test domain logic regarding interlining vs. self-transfers (baggage re-claim requiring landside entry) and determine whether the system distinguishes between a Direct Airside Transit Visa (DATV) and a Visitor in Transit visa.
* **Evaluation Criteria:**
  * Must recognize that self-transfer on separate tickets almost always requires clearing border control to collect baggage from the baggage reclaim hall and check in again landside.
  * Must deduce that because landside transit is required, an airside-only visa (DATV) is insufficient, requiring a Visitor in Transit visa or standard entry clearance.

---

## Test Case 5: Consumer Rights & Disruption Policies (EU261 / Force Majeure)

* **Question:**
  > *"Under EU Regulation 261/2004, what are an airline's obligations regarding cash compensation versus hotel accommodation if a flight from Paris (CDG) to Bali is delayed overnight due to sudden volcanic ash airspace closure versus an airline technical maintenance issue?"*

* **Complexity Level:** High (Legal Comparison & Conditional Disambiguation)
* **Test Objective:** Evaluate ability to differentiate between "extraordinary circumstances" (force majeure like volcanic ash) and internal operational faults (technical aircraft defects), and properly delineate Duty of Care vs. Fixed Monetary Compensation.
* **Evaluation Criteria:**
  * **Duty of Care (Accommodation & Meals):** Must explicitly state that the airline must provide hotel accommodation, transport, and meals in both scenarios regardless of fault.
  * **Monetary Compensation:** Must clarify that compensation (€600 for long-haul) is payable for technical maintenance delays, but exempt for volcanic ash airspace closures as an extraordinary circumstance.