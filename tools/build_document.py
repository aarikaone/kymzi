from pathlib import Path
import json
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_BREAK, WD_ALIGN_PARAGRAPH
from docx.enum.section import WD_SECTION_START
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.enum.style import WD_STYLE_TYPE

ROOT=Path(__file__).resolve().parent.parent / 'docs'
OUT=ROOT/'Rymzi Product Specification and 2000 Questions.docx'
categories=json.loads((ROOT/'categories.json').read_text())
records=json.loads((ROOT/'questions.json').read_text())
pages=[]
def page(title,intro,sections): pages.append((title,intro,sections))

page('Age groups and product boundaries',
'Rymzi serves different stages of growing up through separate experiences. Content eligibility, permission to join and eligibility to meet another player are independent decisions. A suitable question never grants permission for a social connection.',[
('Ages 10 to 12','Use a private mode with guardian-managed access and approved child peers, or supervised local pass-and-play. Disable public profiles, global discovery, searchable usernames, open invitations and stranger contact. A guardian supervises the experience and does not become a discoverable child match. Only the 1,000 questions marked age 10 and above are eligible.'),
('Ages 13 to 17','Make teenagers the main design audience. Separate ages 13 to 15 from ages 16 to 17 in discovery, matching, reactions and saved connections. Use avatars, optional broad country labels and preset reactions. Disable adult discovery, location proximity, open direct messages, uploads and live video.'),
('Ages 18 to 24','Offer the full 2,000-question library. Keep adult discovery separate from minors and divide it into ages 18 to 20 and 21 to 24 initially. Adult accounts cannot search, react to or receive a match with a minor. This is a friendship game; matching answers does not establish romantic or psychological compatibility.'),
('Regional eligibility and age changes','Maintain a reviewed country and feature eligibility policy. A guardian cannot override a local minimum-age restriction. Require an appropriate production age-assurance process, consent where required, an appeal route and limited verification-data retention. At an age boundary, revoke incompatible connections before activating the new discovery group.'),
('Acceptance criteria','The server must reject cross-group discovery, reactions, saved connections and shared-round access even if a client request is modified. In the prototype, cohort filtering demonstrates this rule with fictional data; a selected age group is not verification. Unknown or disputed eligibility disables discovery until resolved.')])

page('Onboarding and personal identity',
'Let a new visitor understand the game before asking for an account. The prototype starts without login. A future live service must complete the relevant age, consent and account controls before exposing any social discovery.',[
('Welcome and guest play','Explain the three-question experience, show the four characters and offer a clear start action. Allow solo practice without a social profile where permitted. Do not request contacts, exact location, school name, photographs or social account access. A guest should reach a first question in a short, understandable sequence.'),
('Character and nickname','Offer Cloud, Orbit, Sunny and Sprout as expressive avatars. Use a nickname with a short length limit, filtering and a generated fallback. Block phone numbers, contact handles, impersonation and identifying text before publication. An avatar choice changes appearance without implying personality traits or a diagnosis.'),
('Age and consent flow','Ask age in a neutral order without steering users toward an eligible answer. Route children to the private experience and applicable guardian process. Record the current consent-policy version and permitted features. A rejected age check provides a safe explanation and appeal without revealing bypass instructions.'),
('Preferences and accessibility','Choose interface language, reduced motion, optional sounds, notification preference and broad interests. Interest choices help organise content and do not narrow matching into sensitive categories. Respect system accessibility preferences and make every preference reversible. Keep consent separate from optional marketing choices.'),
('Account and session lifecycle','When live accounts are added, support secure sign-in, recovery, session revocation and device changes. Explain which guest progress can be imported with consent. Do not merge different users sharing a device. Offer a visible reset in the prototype and an authenticated export or deletion workflow in the live product.')])

page('The daily three question experience',
'The central interaction is a short daily round. Each eligible group sees a comparable question set, answers independently and receives a reveal after submission. The game should feel complete in one brief visit.',[
('Daily scheduling','Publish a versioned set of three questions per content track and age group. Use a canonical server round identifier and a defined UTC boundary, displayed in local time. Users in different time zones can answer the same published round asynchronously. Do not claim an old practice round is happening live.'),
('Answer entry','Accept one word or a short phrase, with a 40-character product limit and clear input guidance. Support keyboard submission, touch-friendly suggestions and accessible validation. Suggestions are editorial options, never unrevealed peer answers. Store original display text separately from a canonical matching value.'),
('Progress and completion','Show the question number, a three-part progress indicator, a back action and a clear exit. Let users revise answers before final submission. Explain that submission locks the live-round answers; replay becomes practice. In the demo, replay can reset the round because results are fictional.'),
('Skipping and connection errors','Allow a question to be skipped without pressure. Exclude missing answers from perfect-match claims. Preserve unsent drafts locally with a visible retry state where allowed, and deduplicate submissions by user and round. A network failure must not erase a completed answer or silently count it twice.'),
('Practice and private play','Offer random rounds and one-question exploration from the age-eligible library. Keep practice results separate from the daily answers. Add supervised two-player pass-and-play with hidden first-player answers and an explicit handover screen. Private rounds must not silently enter global discovery.')])

page('Matching and answer interpretation',
'Match the meaning of the same submitted prompt within the same round and eligible group. The reveal reports observable shared answers. It must not manufacture a perfect match, claim a personality diagnosis or present a popularity ranking as personal value.',[
('Canonical answer rules','Normalise Unicode, trim surrounding spaces, collapse repeated spaces and compare case-insensitively. Add reviewed, prompt-specific aliases such as teleport and teleportation. Do not automatically equate ambiguous regional words such as chips and fries. Keep the original answer for display and the alias-map version for audit.'),
('Candidate eligibility','First filter by verified age group, regional eligibility, consent, current visibility, blocks and moderation state. Then require matching prompt identifiers and versions. Never broaden a minor into an adult group to fill an empty result. Hiding, deletion and blocking invalidate cached match cards.'),
('Scoring and ordering','Count exact canonical matches across the three completed prompts. Label results as 3 of 3, 2 of 3 or 1 of 3, with the shared answers visible. Sort by count and a stable, fair rotation among ties. A same-answer count is the only meaning of the score; do not label it an IQ or compatibility score.'),
('Sparse populations and rarity','A small launch group may produce no exact matches. Show an honest empty state, partial matches or solo practice. Never add fake players or false waiting counts. Only display population proportions after a reviewed minimum group size; a starting privacy threshold of 20 is a proposal requiring validation, not a guarantee of anonymity.'),
('Languages and fairness','Translate prompts around stable semantic identifiers. Combine answers across languages only where the prompt and answer mappings have been reviewed. Otherwise keep language pools separate and explain the scope. Monitor match availability across cohorts and locales without inferring protected or sensitive traits.')])

page('Global reveal and connection cards',
'The reveal should make a small coincidence feel memorable while staying truthful. A shared answer is the beginning of a playful interaction, with permission and privacy controls around every additional step.',[
('Reveal presentation','Use a brief, skippable transition followed by paired avatars, the actual shared count and the overlapping answers. Respect reduced motion and never require sound. Distinguish fictional preview profiles from real live participants. Do not use fabricated distances, live-status dots or scarcity claims.'),
('Country and profile display','Use an optional, broad country or region label with an appropriate privacy explanation. Do not reveal city, school, exact age, location coordinates or last-seen time for minors. A self-declared country is labelled as such in live profile settings; no country label is better than an unsupported location claim.'),
('Preset reactions','Allow a small moderated set of positive reactions such as Same brain, Great taste and You get it. Use a mutual permission model for ongoing connection features. Apply per-pair limits, abuse controls and immediate blocking. No free-text stranger messages, images, audio, video or contact details in the first release.'),
('Bonus round and saved orbit','Offer an optional shared bonus question once both participants are eligible and willing. Show each answer only after both submit. Save a connection to a private orbit with a remove action. A saved person can revoke visibility or consent; the other player then sees a neutral unavailable state.'),
('Boundary and empty states','A missing match should feel ordinary and complete, not like rejection. Offer another practice prompt, a friend round or a return tomorrow. When a match is blocked, withdrawn or reclassified, remove access immediately. Never encourage users to bypass age rules or move a conversation to an unmoderated service.')])

page('Friend rounds and shared sessions',
'Known-friend play gives the app value before a large global audience exists. Invitation and room design must preserve age and permission boundaries rather than allowing a link to bypass them.',[
('Challenge links','Create scoped, revocable challenge links that identify the round without embedding answers or personal information. Define an expiry and completion limit. A recipient sees the purpose and eligibility checks before joining. Link previews show neutral artwork, never a child profile or a hidden answer.'),
('Private rooms','Allow an eligible owner to choose a small room size, topic and start condition. Hide answers until everyone has submitted or the agreed deadline passes. Show absences neutrally and support leaving without penalty. Guardian-managed child rooms require approval of each child peer and disable public search.'),
('Pass and play','Support two people on one device through a clear first-player turn, handover and second-player turn. Obscure the first answers during the second turn. Compare the actual answers after completion and allow a clean restart. This mode does not create discoverable profiles or send data to other users.'),
('Sharing and rematches','Let the user explicitly choose to share a result card or invite link. Respect both players\' visibility choices, include only permitted information and provide a nickname-free version. Rematches require the same permissions as the original round. An invite must never be a condition for seeing earned results.'),
('Room moderation','Let participants leave, mute, block and report directly from the room. Revalidate membership on each interaction and keep a minimal incident trail. Prevent a removed person from returning with an old token. Expired and revoked links have distinct, understandable states without exposing who participated.')])

page('Question library and editorial operations',
'The library contains 2,000 English prompts in 20 themes. Each prompt asks for an opinion, association or imaginative short answer. Stable identifiers make content review, localisation and matching traceable.',[
('Library organisation','Use K0001 through K2000, with 100 questions per theme. The first 1,000 are eligible from age 10, the next 500 from age 13 and the final 500 from age 18. Ages 13 to 17 can therefore access 1,500 questions; ages 18 to 24 can access all 2,000. These are content labels, not permission to meet across ages.'),
('Required content fields','Store prompt ID, theme, language, minimum and maximum age, prompt text, allowed answer format, length limit, content version, reviewed aliases, permitted modes, regional restrictions, reviewer and publication state. The companion JSON provides the basic record structure and marks prompts for editorial review before live publication.'),
('Approval pipeline','Draft, check exact duplicates, inspect semantic repetition, review age suitability, assess cultural interpretation, test matching potential, translate if needed and approve before scheduling. Two editors should review any sensitive borderline topic. Withdrawal removes future scheduling and invalidates affected live reveals when necessary.'),
('Content exclusions','Exclude requests for full names, schools, addresses, contact handles, live location, private secrets, sexual material, substance use, risky dares, appearance rankings and sensitive personal disclosures. Rephrase around preferences and imagination. Avoid prompts whose answers judge another user or expose someone who did not consent.'),
('Scheduling and renewal','Balance everyday, playful and imaginative prompts. Track recent exposure, skip rates and answer diversity to avoid repetitive rounds. Hold seasonal prompts for appropriate locales. Maintain a queue of reviewed replacements. At three questions a day, 2,000 items support 666 complete unrepeated rounds plus two items before age and locale filtering.')])

page('Engagement without pressure',
'The reason to return is fresh curiosity and a pleasant coincidence. Growth features should preserve a short, satisfying session and make sharing a voluntary expression of the result.',[
('Daily rhythm','Offer one optional reminder in a user-chosen local window. Respect quiet hours, operating-system preferences and guardian controls. Allow reminders to be paused easily. Avoid repeated prompts, guilt language, false urgency and escalating notifications about strangers.'),
('Collections and personal progress','Use private badges for exploring themes, completing creative rounds or trying a new character. Do not penalise missed days or sell recovery of a streak. Keep progress personal. Avoid public leaderboards of attractiveness, popularity, number of friends or perceived similarity for minors.'),
('Result cards','Create legible portrait cards for sharing and a downloadable image. Include the actual shared-answer count and omit names or country by default for minors. Preview before the user shares. Provide a version that shows only the user\'s own answers and character.'),
('Discovery and question exploration','Support theme filters, search, age-eligible random rounds and a clear no-results state. Reveal a question before starting a practice round and mark whether the result is solo, private or global. Never overwrite a daily result with a practice answer set.'),
('Optional future events','Consider weekly theme drops, collaborative art rewards and community-curated prompt packs after moderation capacity exists. Keep sponsors separate from matching and preserve eligibility boundaries. Test whether a feature improves genuine return visits and comfort before adding more session length or notifications.')])

page('Safety controls and incident response',
'Safety is a set of working product and operational controls. The no-database preview demonstrates a few interactions, but production discovery must remain disabled until the controls can be enforced and staffed.',[
('Prepublication filtering','Check nicknames, short answers and future user-generated content for prohibited material and contact information before any peer can see it. Rate-limit attempts and record moderation outcomes with limited access. Failed or unavailable moderation holds content privately; it does not publish optimistically.'),
('Block hide and report','Put these actions on every connection and shared session. Blocking removes discovery, reactions and saved-card access in both directions. Report categories include abuse, personal-information requests, age concerns and other issues. A confirmation explains what was submitted, without promising an investigation that has not occurred.'),
('Moderation console','Provide a restricted queue with severity, evidence, relevant policy, prior actions and reviewer ownership. Separate editor, support, moderator and administrator permissions. Record who viewed or changed a case. Support content removal, temporary restriction, suspension, appeal and review of mistaken enforcement.'),
('Urgent incidents','Define an escalation path for credible threats, exploitation, impersonation and suspected age deception. Staff the service during enabled discovery hours and disable affected features when coverage is unavailable. Train reviewers, restrict evidence access and follow applicable reporting and preservation requirements through a reviewed incident process.'),
('Abuse prevention','Detect automated sign-ups, repeated contact-sharing attempts, invitation spam and attempts to evade blocks. Use limited, proportionate signals and human review for consequential actions. Do not expose enforcement thresholds to abusers. Provide an accessible way for legitimate users to contest verification or moderation errors.')])

page('Privacy and data lifecycle',
'Collect the minimum needed for the chosen experience. Short answers can still identify a person when combined with other information, so privacy rules apply to raw answers, derived matches, logs and analytics.',[
('Data collection and age assurance','Store a pseudonymous account ID, permitted age group, consent status, character, language and necessary game state. Prefer verification outcome tokens over retained identity documents. Separate encrypted verification data from public profile data. Do not request full contact books, precise location, school details or biometric data for entertainment features.'),
('Retention proposal','Use a purpose-based schedule approved before launch. A starting design is unsent drafts for up to seven days, live-round raw answers for 30 days, resolved routine reports for 90 days and restricted backups on a fixed deletion cycle. These are proposed defaults, not legal retention periods; serious incidents may require a separately justified hold.'),
('User and guardian controls','Provide clear notices, feature-specific consent, download or export, visibility settings, correction and deletion. Guardians can manage permitted child features and withdraw consent. Explain what others have already seen. A deletion request removes discovery immediately and follows a documented purge and backup-expiry process.'),
('Security and vendor controls','Use transport encryption, encrypted storage, least-privilege access, secret management and audited production access. Avoid answer text in analytics events and application error logs. Review verification, moderation and hosting vendors for data access, subprocessors, deletion and international transfers.'),
('Jurisdiction review','The FTC describes parental notice and consent obligations for covered collection from children under 13 [1]. Australia applies minimum-age rules to services within its regulated scope [2]. Rymzi needs a current classification and market-by-market launch review; a generic worldwide age 10 launch must not be assumed. Regional restrictions take precedence over this product age range.')])

page('Interface screens and accessibility',
'Use a calm, playful interface with strong typography, original characters and one obvious primary action per screen. The web version adopts a centred phone frame on desktop and fills the mobile viewport, following the Medinest pattern.',[
('Screen inventory','Welcome; avatar and nickname; age-group demo selection; daily home; question entry; matching transition; reveal; connection detail; bonus question; saved orbit; searchable question library; sharing sheet; settings; report sheet; empty and restricted states. The live product adds consent, age assurance, account recovery and moderator interfaces.'),
('Visual system','Use warm white surfaces, dark readable text, lime actions and small cobalt or lavender accents. Keep rounded cards, consistent spacing and generous touch targets. Character artwork should remain recognisable at small sizes. Use native safe-area spacing and respect browser or system controls rather than drawing fake operating-system controls.'),
('Motion and feedback','Animate character float, progress and reveals lightly. Keep transitions brief and interruptible. Provide clear pressed, disabled, loading, error and success states. Every sound has a visual equivalent and an off switch. Reduced-motion mode uses an immediate, fully understandable reveal.'),
('Accessibility target','Target WCAG 2.2 AA for the web experience [3]. Include keyboard access, visible focus, semantic headings, labels, screen-reader status messages, readable contrast, zoom and reflow, motion preferences and accessible authentication. Validate with assistive technology; a visual review alone does not establish conformance.'),
('Responsive behaviour','Test narrow phones, large phones, tablets and desktop frames. Keep the answer field and primary button visible when the keyboard opens. Avoid horizontal page overflow and prevent a bottom navigation bar from covering content. Long nicknames, translated text and large text settings must wrap without truncating essential actions.')])

page('Architecture and shared implementation',
'The repository separates a responsive React web app, an Expo React Native app, shared question and matching logic, and shared visual assets. The current experience deliberately has no backend, account system or database.',[
('Repository layout','apps/web contains the Vite React interface and static assets. apps/mobile contains the Expo iOS and Android entry point. packages/core contains typed questions, cohort rules, aliases and deterministic matching against fictional profiles. packages/assets contains original avatar PNGs and optimised copies. docs contains this specification and the JSON question bank.'),
('Prototype state','Web state uses a versioned browser-local record for the chosen character, daily answers, saved fictional connections and reactions. Native preview state remains in memory. Reset clears the local preview. Question search and practice run locally. No telemetry, analytics SDK, account token or remote answer submission is included.'),
('Production service boundaries','Add identity and consent, question scheduling, answer submission, moderation, matching, reactions, notification delivery and reporting as explicit services. Enforce age and block rules at each API boundary. A client-side filter is only presentation and cannot enforce live permissions.'),
('Production records and endpoints','Model Account, AgeEligibility, Consent, Profile, PromptVersion, Round, Answer, Match, Connection, Reaction, Block, Report and AuditEvent. Suggested operations include GET daily round, POST answers, GET eligible matches, POST reaction, POST block, POST report and DELETE account. Use authenticated authorisation, idempotency and version checks.'),
('Performance and reliability','Ship compressed avatars, local fonts and cacheable static files. Split large library data where needed. A proposed initial service target is 99.5 percent monthly availability, with explicit latency budgets set after load tests. Keep restore drills, dependency reviews, backup verification and a kill switch for discovery and reactions.')])

page('Operations measurement and commercial model',
'Measure whether a short visit creates a satisfying connection. The metrics below are product definitions and proposed experiments, not claims about current adoption or a guaranteed probability of virality.',[
('Product measurements','Measure first-round completion, time to first reveal, answer validation failures, voluntary replay, day-one and day-seven return, practice use and saved connections. Segment by permitted age group and locale only at adequate privacy thresholds. Avoid collecting raw answers in general analytics.'),
('Sharing and network growth','Track voluntary share intent, successful share actions where observable, invitation acceptance and activation. Evaluate whether one activated player leads to additional activated players through real invitations. Do not replace this with download counts, forced invites or social-pressure prompts.'),
('Comfort and safety measurements','Track report frequency per active interaction, block use, moderation response time, age-check appeals, wrongful restriction rates and inaccessible-flow reports. Interpret report changes with exposure and staffing context. Growth does not override a worsening safety signal.'),
('Commercial options','Keep core questions, reveals, safety tools and privacy controls free. Consider optional cosmetic character packs, share-card themes or family-approved private packs after demand is demonstrated. Show a clear total price and appropriate purchase controls. Avoid targeted advertising to minors, selling answers, paid access to people and paid rare-match boosts.'),
('Service ownership','Assign product, engineering, content, privacy, accessibility and moderation owners before launch. Maintain a reviewed support process, incident rota, content calendar and release rollback plan. Review the prototype with teenagers and guardians using consented research and meaningful feedback rather than engagement pressure.')])

page('Release stages and acceptance criteria',
'The interactive preview and a live social product are separate milestones. Release in small steps so the team can assess whether the daily reveal is enjoyable before adding accounts, stranger contact or a wider age and geographic footprint.',[
('Stage one interactive preview','Deliver no-login character onboarding, three questions, fictional same-cohort matching, accurate shared-answer counts, local saved orbit, preset demo reactions, a bonus prompt, card sharing and download, a searchable 2,000-question library and reset. Include the Expo foundation and shared core. Label fictional people and the limits of demo reports.'),
('Stage two closed live pilot','Choose eligible markets and age groups after review. Add verified eligibility, consent, real moderation, authenticated APIs, privacy controls, server-side cohort enforcement and a staffed support process. Test with a small invited group. Disable features whose controls or coverage are incomplete.'),
('Stage three broader availability','Expand locales only with translated and reviewed content, sufficient appropriate peers and operational coverage. Add private rooms, prompt collections and optional cosmetics after evidence supports them. Free-text messaging, public profiles and uploads require their own design, moderation and eligibility review; they are not automatic follow-on features.'),
('Required functional checks','Verify exactly 2,000 unique IDs and prompts; the 1,000, 1,500 and 2,000 age-eligible counts; no cross-group or child-global matches; valid alias behaviour; truthful perfect and partial results; no result from incomplete answers; immediate blocking; practice preserving daily answers; refresh and reset; working search, share and empty states.'),
('Required release checks','Test iOS and Android native builds on devices, browser responsiveness, keyboard access, screen readers, large text, poor networks and reduced motion. Complete security, consent, regional eligibility, incident readiness and deletion checks before live launch. Design-award recognition is an ambition; quality and usability must be assessed directly and cannot be promised.')])

page('Library instructions and reference sources',
'The following pages contain all 2,000 prompts, with stable IDs and age labels. They are intended for short-answer matching and practice; there are no correct answers or personality diagnoses.',[
('How to use the question bank','Ask the identical prompt version to comparable players, accept one word or a short phrase and compare reviewed canonical answers. Use three different themes in a daily round when possible. Keep answers hidden until submission. Apply age eligibility first, then regional, language, mode and editorial restrictions.'),
('Age labels and inventory','K0001 to K1000: ages 10 to 24. K1001 to K1500: ages 13 to 24. K1501 to K2000: ages 18 to 24. Every theme contains 100 prompts. An age label describes question suitability; discovery always remains within the separate permitted age groups.'),
('Editorial use','Review comprehension, cultural assumptions, semantic repetition and likely answer diversity before live scheduling. The supplied English bank is a content inventory, not evidence that every prompt has been tested with young users. Maintain approved aliases and translations separately, then version changes rather than silently replacing a published prompt.'),
('Reference sources','[1] Federal Trade Commission. Complying with COPPA Frequently Asked Questions. https://www.ftc.gov/business-guidance/resources/complying-coppa-frequently-asked-questions\n[2] Australian eSafety Commissioner. Social media age restrictions FAQ. https://www.esafety.gov.au/about-us/industry-regulation/social-media-age-restrictions/faqs\n[3] World Wide Web Consortium. Web Content Accessibility Guidelines 2.2. https://www.w3.org/TR/WCAG22/\nSources accessed 16 November 2026. Review applicable requirements again before a live launch.')])

doc=Document()
sec=doc.sections[0]
sec.page_width=Inches(8.2677);sec.page_height=Inches(11.6929)
sec.top_margin=Inches(.68);sec.bottom_margin=Inches(.65);sec.left_margin=Inches(.7);sec.right_margin=Inches(.7)
sec.header_distance=Inches(.22);sec.footer_distance=Inches(.28)
for name in ['Normal','Title','Subtitle','Heading 1','Heading 2','Heading 3']:
 st=doc.styles[name];st.font.name='Arial';st.font.color.rgb=RGBColor(0,0,0)
 st.paragraph_format.space_after=Pt(7)
doc.styles['Normal'].font.size=Pt(10.5)
doc.styles['Normal'].paragraph_format.line_spacing=1.13
doc.styles['Title'].font.size=Pt(30);doc.styles['Title'].font.bold=True
doc.styles['Title'].paragraph_format.space_after=Pt(14)
doc.styles['Subtitle'].font.size=Pt(12)
doc.styles['Heading 1'].font.size=Pt(23);doc.styles['Heading 1'].font.bold=True
doc.styles['Heading 1'].paragraph_format.space_after=Pt(13)
doc.styles['Heading 2'].font.size=Pt(12);doc.styles['Heading 2'].font.bold=True
doc.styles['Heading 2'].paragraph_format.space_before=Pt(13);doc.styles['Heading 2'].paragraph_format.space_after=Pt(5)
for n in ['Prompt','Index','Small']:
 st=doc.styles.add_style(n,WD_STYLE_TYPE.PARAGRAPH);st.base_style=doc.styles['Normal']
doc.styles['Prompt'].font.size=Pt(10.2);doc.styles['Prompt'].paragraph_format.line_spacing=Pt(11.9)
doc.styles['Prompt'].paragraph_format.space_after=Pt(3)
doc.styles['Prompt'].paragraph_format.keep_together=True
doc.styles['Prompt'].paragraph_format.left_indent=Inches(0);doc.styles['Prompt'].paragraph_format.first_line_indent=Inches(0)
doc.styles['Index'].font.size=Pt(9.5);doc.styles['Index'].paragraph_format.space_after=Pt(4);doc.styles['Index'].paragraph_format.line_spacing=1.05
doc.styles['Small'].font.size=Pt(9);doc.styles['Small'].paragraph_format.line_spacing=1.12

bookmark_num=0
def bookmark(p,name):
 global bookmark_num
 bookmark_num+=1
 a=OxmlElement('w:bookmarkStart');a.set(qn('w:id'),str(bookmark_num));a.set(qn('w:name'),name)
 b=OxmlElement('w:bookmarkEnd');b.set(qn('w:id'),str(bookmark_num))
 p._p.insert(0,a);p._p.append(b)
def nav(label,target):
 p=doc.add_paragraph(style='Index');link=OxmlElement('w:hyperlink');link.set(qn('w:anchor'),target)
 r=OxmlElement('w:r');props=OxmlElement('w:rPr');c=OxmlElement('w:color');c.set(qn('w:val'),'000000');props.append(c);r.append(props);t=OxmlElement('w:t');t.text=label;r.append(t);link.append(r);p._p.append(link)
def field(p,name):
 f=OxmlElement('w:fldSimple');f.set(qn('w:instr'),name);p._p.append(f)
footer=sec.footer.paragraphs[0];footer.alignment=WD_ALIGN_PARAGRAPH.RIGHT
footer.add_run('Rymzi  |  ').font.size=Pt(8);field(footer,'PAGE')

p=doc.add_paragraph('Rymzi Product Specification and Question Library',style='Title');bookmark(p,'Overview')
doc.add_paragraph('Complete feature specification and 2000 prompts for ages 10 to 24',style='Subtitle')
doc.add_paragraph('Product and engineering reference  |  Version 1  |  16 November 2026',style='Small')
doc.add_paragraph('Rymzi is a short-answer social game built around a simple moment: someone elsewhere chose the same unexpected answers as you. Players answer three playful questions, see the real overlap and choose whether to keep the connection. The primary experience is designed for teenagers, with a private experience for ages 10 to 12 and separate adult experiences for ages 18 to 24.')
doc.add_paragraph('This document defines the full product, the boundaries between age groups, the no-login demonstration, the proposed production controls and a library of 2,000 questions. It gives designers, developers, editors and operators a shared reference for building the web and mobile experience.')
doc.add_heading('The central experience',level=2)
doc.add_paragraph('Choose a character and nickname. Answer three short questions independently. Reveal the actual shared answers. Offer a preset reaction or a bonus question. Save a permitted connection to a private orbit. Finish the session with a useful or amusing result, whether or not a match exists.')
doc.add_heading('What the prototype includes',level=2)
doc.add_paragraph('A responsive web app, a working Expo mobile foundation, four original avatar assets, an age-filtered question library and shared matching logic. All profiles and connections are fictional. Web progress is browser-local; the native preview uses memory. Login, a database, real messages, live discovery and production age verification are outside the preview.')
doc.add_heading('What a live launch requires',level=2)
doc.add_paragraph('Age and consent controls, local eligibility review, server-side permission enforcement, staffed moderation, data lifecycle controls and verified accessibility and security. The 10 to 24 audience range describes the product family and does not mean every social feature is available at every age or in every market.')
doc.add_heading('Question bank at a glance',level=2)
doc.add_paragraph('20 themes with 100 prompts each. 1,000 prompts are eligible from age 10, 500 more from age 13 and 500 more from age 18. Players answer in one word or a short phrase. Every prompt has a stable K identifier so content and code can refer to the same record.')

doc.add_page_break()
p=doc.add_heading('Document navigation',level=1);bookmark(p,'Navigation')
doc.add_paragraph('Select a section or theme to jump to it. Word also exposes the heading outline in its Navigation pane.',style='Small')
for i,(title,_,_) in enumerate(pages):nav(f'{i+3:02d}   {title}',f'Section{i+1:02d}')
doc.add_heading('Question themes',level=2)
bank_start=len(pages)+3
for i,c in enumerate(categories):nav(f'{bank_start+i*2:02d}   {c["title"]}   |   K{i*100+1:04d} to K{(i+1)*100:04d}   |   Ages {c["min_age"]} to 24',f'Category{i+1:02d}')

for i,(title,intro,sections) in enumerate(pages):
 doc.add_page_break()
 p=doc.add_heading(title,level=1);bookmark(p,f'Section{i+1:02d}')
 doc.add_paragraph(intro)
 for sub,body in sections:
  doc.add_heading(sub,level=2)
  for paragraph in body.split('\n'):
   p=doc.add_paragraph(paragraph,style='Small' if sub=='Reference sources' else 'Normal')

bank=doc.add_section(WD_SECTION_START.NEW_PAGE)
cols=bank._sectPr.find(qn('w:cols'));cols.set(qn('w:num'),'2');cols.set(qn('w:space'),'360')
for ci,c in enumerate(categories):
 for half in range(2):
  for column in range(2):
   offset=half*50+column*25
   p=doc.add_paragraph()
   p.paragraph_format.space_after=Pt(6);p.paragraph_format.keep_with_next=True
   if half==0 and column==0:bookmark(p,f'Category{ci+1:02d}')
   r=p.add_run(c['title']);r.font.size=Pt(12);r.bold=True
   p=doc.add_paragraph(f'Ages {c["min_age"]} to 24  |  K{ci*100+offset+1:04d} to K{ci*100+offset+25:04d}',style='Small')
   p.paragraph_format.space_after=Pt(12);p.paragraph_format.keep_with_next=True
   for qi,q in enumerate(c['questions'][offset:offset+25]):
    number=ci*100+offset+qi+1
    p=doc.add_paragraph(style='Prompt');r=p.add_run(f'K{number:04d}  ');r.bold=True;p.add_run(q)
   if column==0:
    p=doc.add_paragraph();p.paragraph_format.space_before=Pt(0);p.paragraph_format.space_after=Pt(0);p.paragraph_format.line_spacing=Pt(1)
    r=p.add_run();r.font.size=Pt(1);r.add_break(WD_BREAK.COLUMN)
  if not(ci==19 and half==1):doc.add_page_break()

for element in list(doc.styles.element.iter(qn('w:pBdr'))) + list(doc.element.iter(qn('w:pBdr'))):
 element.getparent().remove(element)
doc.core_properties.title='Rymzi Product Specification and Question Library'
doc.core_properties.subject='Feature specification and 2000 age-labelled short-answer prompts'
doc.core_properties.author='Rymzi'
doc.core_properties.keywords='Rymzi, product specification, questions, web, mobile'
OUT.parent.mkdir(parents=True,exist_ok=True);doc.save(OUT)
print(json.dumps({'output':str(OUT),'specification_pages_expected':len(pages)+2,'question_pages_expected':40,'total_pages_expected':len(pages)+42,'questions':len(records),'file_bytes':OUT.stat().st_size},indent=2))
