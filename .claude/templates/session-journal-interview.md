# Session Journal Interview Template

This template provides structured questions to gather session information consistently. Use this to interview yourself or the AI agent at the end of each major session.

## Session Context

**Q1:** What date did this session occur, and approximately how long did it last?

**Q2:** What was the primary goal or focus of this session? (1-2 sentences)

**Q3:** Which agents or team members were actively involved in this session?

**Q4:** Was this session planned work or responding to an incident/urgent need?

## Infrastructure and Technical Work

**Q5:** What infrastructure changes were made during this session? (VMs created, networks configured, storage allocated, etc.)

**Q6:** What configuration files were created or modified? List the file paths and briefly describe what each change accomplishes.

**Q7:** Were any Terraform, Ansible, or IaC deployments executed? What was deployed?

**Q8:** Were any systems taken offline, decommissioned, or removed?

**Q9:** What is the current state of the infrastructure? (All systems operational, some pending, issues detected?)

## Documentation and Knowledge

**Q10:** What new documentation was created? (Design docs, runbooks, guides, etc.)

**Q11:** What existing documentation was updated or corrected?

**Q12:** Were any new design patterns or architectural decisions documented?

**Q13:** What knowledge gaps were discovered during this session? (Things we realized we don't know)

**Q14:** What expertise or research was needed that wasn't immediately available?

## Problems and Solutions

**Q15:** What problems or errors were encountered during this session?

**Q16:** For each problem, how was it resolved? (Or is it still unresolved?)

**Q17:** Were any decisions or changes reversed or rolled back? Why?

**Q18:** What workarounds were implemented? Are they temporary or permanent?

**Q19:** What issues remain unresolved and need follow-up?

## Decisions and Choices

**Q20:** What were the key technical decisions made during this session?

**Q21:** For each major decision:
- What was the context or problem driving the decision?
- What choice was made?
- What alternatives were considered?
- Why was this choice selected over alternatives?

**Q22:** Were any process or workflow decisions made? (How we work, not what we build)

**Q23:** Were any assumptions challenged or validated during this session?

## Progress and Metrics

**Q24:** What phase(s) of the project were we working on? (Phase 0, 1, 2, etc.)

**Q25:** How much progress was made toward phase completion? (Rough percentage or milestone status)

**Q26:** How many GitHub Issues were:
- Created?
- Worked on?
- Completed/closed?
- Blocked?

**Q27:** How many Pull Requests were:
- Created?
- Reviewed?
- Merged?

**Q28:** Were any Git tags created? (Releases, snapshots, milestones)

**Q29:** What is the total documentation size now? (Approximate KB or number of files)

**Q30:** How many commits were made? Approximate lines added/removed?

## Quality and Validation

**Q31:** Were any tests run? Did they pass or reveal issues?

**Q32:** Were security scans or compliance checks performed?

**Q33:** Was any peer review or validation done on the work?

**Q34:** Are there any known technical debt items introduced? (Temporary solutions, TODOs, etc.)

## Advances and Wins

**Q35:** What are the top 3 advances or achievements from this session?

**Q36:** What capabilities do we now have that we didn't before?

**Q37:** What risks were mitigated or eliminated?

**Q38:** What efficiency improvements were made?

## Losses and Setbacks

**Q39:** What didn't work as expected?

**Q40:** What took longer than anticipated? Why?

**Q41:** Were any planned features or capabilities descoped or deferred?

**Q42:** What resources (time, budget, hardware) were consumed?

## Lessons Learned

**Q43:** What went particularly well during this session?

**Q44:** What would you do differently if repeating this work?

**Q45:** What surprised you during this session? (Good or bad surprises)

**Q46:** What skills or knowledge would have made this session more efficient?

## Next Steps and Planning

**Q47:** What are the immediate next tasks for the following session?

**Q48:** What items are currently blocked and what's needed to unblock them?

**Q49:** Are there any upcoming deadlines or time-sensitive milestones?

**Q50:** What preparation or research should be done before the next session?

**Q51:** Are there any dependencies on external parties? (Vendor responses, hardware delivery, etc.)

## Cross-References and Context

**Q52:** Which GitHub Issues are most relevant to this session? (List issue numbers and brief titles)

**Q53:** Which Pull Requests are most relevant to this session?

**Q54:** What documentation files should someone read to understand this session's work?

**Q55:** Were any external resources or references particularly helpful? (Links, docs, articles)

## Meta-Reflection

**Q56:** How effective was the agent orchestration during this session?

**Q57:** Did the current workflow and processes work well, or should anything change?

**Q58:** What tools or capabilities would have made this session more productive?

**Q59:** Rate this session's productivity: Low / Medium / High. Why?

**Q60:** Any other observations or notes about this session?

---

## Interview Notes

**Interviewer:** [Who conducted the interview]
**Interviewee:** [Who was interviewed - agent name or human]
**Interview Date:** [When this interview was conducted]
**Session Date:** [The actual session being documented]

## Output Format

After completing this interview, generate:
1. A summary document in `docs/journals/YYYY-MM-DD-session-journal.md`
2. Update `docs/homelab-progress-summary.md` with session highlights
3. Create GitHub Issue with label `session-journal` linking to the journal document

---

**Template Version:** 1.0
**Last Updated:** 2024-12-24
