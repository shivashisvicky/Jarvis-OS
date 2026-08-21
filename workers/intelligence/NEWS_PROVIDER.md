# JARVIS News Provider

The production news endpoint uses parallel multi-source RSS feeds rather than direct browser requests to GDELT or Google News RSS search.

- WORLD: BBC World, NPR World, Al Jazeera, DW World
- INDIA: BBC India, India Today, Indian Express, Times of India
- AI: TechCrunch AI, WIRED, Ars Technica, BBC Technology
- TECH: BBC Technology, TechCrunch, WIRED, Ars Technica

The Worker normalizes RSS/Atom entries, de-duplicates links, sorts by publication time, and returns provider diagnostics including successful and failed sources and latency.
