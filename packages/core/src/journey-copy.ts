/** The shared pal-first story, with a private city journey for ages 10–12. */
export const JOURNEY_COPY = {
 title:'Someone new.',titleAccent:'Somewhere new.',
 welcome:'Match 3 answers. Explore their city.',
 start:'Find my pal',resume:'Continue my answers',reveal:'Meet my pal',
 topicHint:'3 answers. One unknown pal.',navHome:'Explore',
 emptyCity:'Your pal’s city awaits.',emptyHint:'Match 3 answers to find your first pal.',
 galleryPhotos:'Their moments',galleryPals:'Your pals',
 galleryEnd:'Another pal. Another story.',galleryEndHint:'That’s their world for now.',
 updates:'Fresh from your pals',trail:['Match 3','Their photos','Explore'] as const,
 privateStart:'Discover a city',privateReveal:'Discover my city',
 privateTrail:['Answer 3','Reveal city','Explore'] as const,
} as const;

/** One explanation shared by the web and native welcome pages. */
export const WELCOME_DESCRIPTION='Bring five friends. Unlock pal finding worldwide.';
