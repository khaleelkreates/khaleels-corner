# Story cover photographs

The starter covers are licensed stock photographs used as editorial illustrations, not photographs supplied by Khaleel or documentary records of the events in the articles. Source URLs, accessible descriptions and license links are recorded per article in `covers.json`.

Unsplash photographs may be used on websites under the [Unsplash License](https://unsplash.com/license). The two Lagos street photographs use the [Pexels License](https://www.pexels.com/license/). Image credits appear beneath the cover on article pages.

The photographs are stored locally in `assets/images/covers/`; the deployed site does not depend on stock-photo servers. Only covers used by published articles are copied into `dist`. Images load lazily in the reading grid and eagerly for the featured story and article lead image. Width and height are specified to reduce layout movement.

To change a cover: open the Writing Desk, upload **Story cover photograph**, add a description and optional caption, and publish. A CMS upload takes priority over a starter cover. A new article without a photograph receives a starter cover based on its topic. Text and article addresses are unchanged by this visual update.

The layout takes general editorial cues from [Substack](https://substack.com) and [Medium](https://medium.com), with an image-led browsing grid. Pinterest's homepage was inaccessible to the research tool; no Pinterest image or page content was copied.
