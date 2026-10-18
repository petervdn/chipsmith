# 0046. Every page is as wide, the top bar with it; a narrower page keeps to the left

- Status: accepted
- Date: 2026-10-18

## Context
Pages were 1,100 px at most, a song's page 1,600 px for its editor, and the top bar's content
followed the page's width. Going from Songs to a song moved the logo, the tabs and the left edge
of the page by 250 px on a wide screen. The Guides, References and New pages were narrower still
(720 and 886 px), each centred, so their left edges were somewhere else again.

## Decision
- One width for every page and the top bar: `--page-width`, 1,400 px at most, centred beyond that.
  The bar and a page's left edge stay put from page to page.
- A page that is narrower by nature (a form, text to read) keeps its own width but is not centred:
  it keeps to the left, under the logo and the breadcrumbs.

## Alternatives
- **The editor at 1,600 px, the top bar's content full width on every page** (the logo at the far
  left, the tabs at the far right): the bar stays put, but the pages' left edges still move.
- **Every page at 1,600 px.** The lists' rows and the prose stretch too far apart.
- **The narrow pages centred within the width.** Their left edge would move again.

## Consequences
On screens wider than 1,400 px the editor has 200 px less than before; on a laptop's screen it
makes no difference, the page being narrower than either. The lists are wider than before.
