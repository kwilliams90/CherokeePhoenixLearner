# Cherokee Phoenix Learner
Lightweight extension that enhances Cherokee Phoenix articles by displaying a Latin transliteration below each line of Cherokee text, making it easier to read, learn, and follow along.


This extension adds a small romanization line right under each Cherokee line in the article body on cherokeephoenix.org. It avoids English paragraphs and won't double-annotate. It has been tested on Opera GX Version LVL 7 Core: 120.0.5543.160

It is meant to assist with learning to read the Cherokee syllabary. 


## Installation

1\. Download the zip file cpil.zip and unzip the file. 

2\. Go to `chrome://extensions` or 'opera://extensions' in the address bar

3\. Enable **Developer mode**

4\. **Load unpacked** → select the unzipped folder containing `manifest.json`



## Notes

\- Runs only on `#article-body`.

\- Activates if it finds either the loose marker “ᏓᎵᏆ” *or* any Cherokee-script characters in the article.

\- Toggle button appears near the headline (fallback: above article body).

\- The transliteration scheme is a broad syllabary→latin mapping. Adjust `CH\_MAP` in `transliterate.js` if you prefer a different convention.





Developer: Kelly Williams

