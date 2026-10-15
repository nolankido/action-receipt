import type { Extraction, RawAction } from "./receipt.ts";
export const reviewScenario = {
  title: "Invented field trip notice",
  source: "CAMPUS FIELD TRIP\nSynthetic practice notice, not an actual event.\n\nRegister for the museum trip by Nov. 5, 2032. Participants must attach a signed consent form.\n\nPay the transport deposit by Tuesday, Nov. 8, 2032. Bring your student ID on Nov. 12, 2032.\n\nYou do not need to pay a separate membership fee.\n\nIf you need accessible transport, email the coordinator by next Friday.",
};
function action(title: string, evidence: string, deadline: RawAction["deadline"], condition: string | null = null, issues: string[] = []): RawAction {
  return { title, condition, evidence: [evidence], deadline, issues };
}
function deadline(text: string, quote: string, date: string | null, status: RawAction["deadline"]["status"] = "explicit"): RawAction["deadline"] {
  return { text, evidence: quote ? [quote] : [], date, time: null, utcOffset: null, status };
}
export const samples: { id: string; label: string; kind: string; description: string; title: string; source: string; result: Extraction }[] = [
  {
    id: "workshop", label: "Campus workshop", kind: "Separate deadlines", description: "Registration, payment, and a date that needs a second look.", title: "Student photography workshop",
    source: "STUDENT PHOTOGRAPHY WORKSHOP\nCampus Arts Club · Synthetic example\n\nJoin our workshop on November 10, 2026, in the student center.\n\nRegister using the club form by November 5, 2026. Pay the $15 materials fee by November 7, 2026. Registration does not include payment.\n\nBring your student ID to check in on November 10, 2026.\n\nIf you need accessibility accommodations, email the coordinator by next Friday.\n\nQuestions? Contact the club office. This notice is an invented example, not an actual campus announcement.",
    result: { actions: [
      action("Register for the workshop", "Register using the club form by November 5, 2026.", deadline("November 5, 2026", "Register using the club form by November 5, 2026.", "2026-11-05")),
      action("Pay the $15 materials fee", "Pay the $15 materials fee by November 7, 2026.", deadline("November 7, 2026", "Pay the $15 materials fee by November 7, 2026.", "2026-11-07")),
      action("Bring your student ID", "Bring your student ID to check in on November 10, 2026.", deadline("November 10, 2026", "Bring your student ID to check in on November 10, 2026.", "2026-11-10")),
      action("Email the coordinator about accommodations", "If you need accessibility accommodations, email the coordinator by next Friday.", deadline("next Friday", "If you need accessibility accommodations, email the coordinator by next Friday.", null, "ambiguous"), "Only if you need accessibility accommodations"),
    ], notes: ["The workshop date is different from the registration and payment deadlines.", "The notice does not establish which calendar date ‘next Friday’ means."] },
  },
  {
    id: "grant", label: "Student grant", kind: "Missing context", description: "A relative date and a timed cutoff with no time zone.", title: "Student research grant notice",
    source: "STUDENT RESEARCH GRANT\nSynthetic example\n\nSubmit your project outline within seven days of receiving this notice.\n\nUpload your budget by December 2, 2026 at 5:00 pm.\n\nA recommendation letter is optional. If you choose to include one, ask your adviser to upload it by December 1, 2026.\n\nThe information session is November 20, 2026. Attendance is not required.\n\nThis is an invented notice for testing. The received date and time zone are intentionally unspecified.",
    result: { actions: [
      action("Submit your project outline", "Submit your project outline within seven days of receiving this notice.", deadline("within seven days of receiving this notice", "Submit your project outline within seven days of receiving this notice.", null, "ambiguous")),
      action("Upload your budget", "Upload your budget by December 2, 2026 at 5:00 pm.", { ...deadline("December 2, 2026 at 5:00 pm", "Upload your budget by December 2, 2026 at 5:00 pm.", "2026-12-02"), time: "17:00" }, null, ["The notice does not specify a time zone. Confirm the UTC offset before calendar export."]),
      action("Ask your adviser to upload a recommendation", "A recommendation letter is optional. If you choose to include one, ask your adviser to upload it by December 1, 2026.", deadline("December 1, 2026", "If you choose to include one, ask your adviser to upload it by December 1, 2026.", "2026-12-01"), "Optional: only if you choose to include a recommendation letter"),
    ], notes: ["The information session is optional and is not a submission deadline."] },
  },
  {
    id: "club", label: "Club application", kind: "Conflicting dates", description: "Conflicting instructions stay visible until clarified.", title: "Campus makers club application",
    source: "CAMPUS MAKERS CLUB\nApplication notice · Synthetic example\n\nApplications close on December 8, 2026.\n\nUse the membership form to apply. At the bottom of the same form, the printed deadline says December 11, 2026. This notice does not say which deadline is correct.\n\nIf your project uses the workshop, complete the safety orientation by December 15, 2026.\n\nYou do not need to pay a membership fee. An older payment request has been withdrawn.\n\nContact the club coordinator to clarify the application deadline. This is an invented notice for demonstration.",
    result: { actions: [
      { ...action("Apply using the membership form", "Use the membership form to apply.", deadline("December 8, 2026 or December 11, 2026", "Applications close on December 8, 2026.", null, "conflict")), deadline: { ...deadline("December 8, 2026 or December 11, 2026", "Applications close on December 8, 2026.", null, "conflict"), evidence: ["Applications close on December 8, 2026.", "At the bottom of the same form, the printed deadline says December 11, 2026."] } },
      action("Complete the safety orientation", "If your project uses the workshop, complete the safety orientation by December 15, 2026.", deadline("December 15, 2026", "If your project uses the workshop, complete the safety orientation by December 15, 2026.", "2026-12-15"), "Only if your project uses the workshop"),
      action("Contact the coordinator to clarify the application deadline", "Contact the club coordinator to clarify the application deadline.", deadline("", "", null, "missing")),
    ], notes: ["The payment request was withdrawn. No payment action is proposed.", "Both application dates are preserved; the walkthrough does not choose one."] },
  },
];
