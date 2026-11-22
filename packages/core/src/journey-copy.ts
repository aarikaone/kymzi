/** The shared pal-first story, with a private city journey for ages 10–12. */
export const JOURNEY_COPY = {
 title:'Someone new.',titleAccent:'Somewhere new.',
 welcome:'Answer 3. Match 2. Meet a Roamie.',
 start:'Find a Roamie',resume:'Continue my answers',reveal:'View Roamie',
 topicHint:'Answer 3 travel questions.',navHome:'Explore',
 emptyCity:'Your Roamie’s city awaits.',emptyHint:'Match 2 of 3 answers to meet your first Roamie.',
 galleryPhotos:'Their moments',galleryPals:'Your Roamies',
 galleryEnd:'Another Roamie. Another story.',galleryEndHint:'That’s their world for now.',
 updates:'Fresh from your Roamies',trail:['Answer 3','Meet a Roamie','Explore'] as const,
 privateStart:'Discover a city',privateReveal:'Discover my city',
 privateTrail:['Answer 3','Reveal city','Explore'] as const,
} as const;

/** One explanation shared by the web and native welcome pages. */
export const WELCOME_DESCRIPTION='Invite 5 friends to meet Roamies worldwide.';
