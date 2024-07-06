---
title: "Understanding the Event Loop in Chrome Web Browser"
---

## Understanding the Event Loop in Chrome Web Browser

### Browser Processes and Threads

Browsers operate through processes and threads, much like how applications run programs and execute tasks. Each Chrome browser window spawns its own browser process (or browser engine). Within that process, each tab runs in its own renderer process (or rendering engine).

The browser process handles everything outside of the tabs, while each renderer process manages the contents within its respective tab.
The JavaScript engine is embedded within each renderer process.

To illustrate with an example, when you type something into the address bar, the browser process evaluates it first. If it's a search query, it passes it to the search engine; if it's a URL, it uses the network thread within the browser process to request the resource. Once deemed safe, the browser process hands off the data to the renderer process for that tab to render the web page (known as the rendering process or Rendering Critical Path).

### How the Browser Event Loop Operates

When the browser process identifies the user input as a URL, it requests the corresponding IP address from the DNS server via the network thread. It checks the cached DNS records first; if not found, it requests the IP address from the DNS server, a process known as Recursive Query. This recursive search continues until the IP address for the domain is found.

With the IP address in hand, the browser process requests the HTML document from the web server. The HTTP request is sent through the TCP/IP protocol stack, following the path of HTTP → TCP → IP → Ethernet. The request is then encapsulated in an Ethernet frame and transmitted to the server. Upon reaching the server, the frame is decapsulated back into Ethernet → IP → TCP → HTTP and sent to the web server program. A TCP 3-Way Handshake establishes the connection between the client and server, allowing for complete request and response exchanges.

If HTTPS is used, an SSL protocol layer is added before the HTTP request. After a complete request/response cycle, the cache lifecycle is determined by the response header’s Cache-Control directive.

Upon receiving the complete request, the web server may interact with a WAS (Web Application Server) for dynamic content or database operations. The WAS processes the request and returns the result to the web server, which then sends the HTML document back to the browser. The browser hands the HTML file to the renderer process, where the main thread starts the rendering process.

The main thread first parses the HTML into a DOM Tree, halting at blocking resources like `<link>` tags or non-async/non-defer `<script>` tags. CSS files are also considered blocking to prevent Flash of Unstyled Content (FOUC). The parser may use a preload scanner to handle requests in parallel, improving performance.

The main thread constructs the DOM Tree, creates the CSSOM Tree, and then builds the Render Tree. The rendering steps involve Layout, Paint, and Compositing, summarized as Parsing → Style → Layout → Paint → Composite.

- Layout: Calculates the exact position and size of nodes in the Render Tree.
- Paint: Draws the layout on the screen, dividing it into layers.
- Reflow & Repaint: Recalculates and redraws elements when changes occur.
- Composition: Combines layers according to their z-index, optimizing re-rendering to enhance speed.

When encountering a `<script>` tag, parsing stops, and control is handed over to the JavaScript engine within the renderer process, introducing the concept of the event loop. The event loop monitors the JavaScript engine's call stack and various queues, transferring tasks from queues to the call stack when it’s empty. This model ensures JavaScript’s concurrency.

The main thread runs JavaScript code through the JS engine, which has a memory heap and a call stack. The call stack operates on a single-threaded basis, processing one task at a time.

Web APIs are designed to run outside the JS engine, managed by the event loop, which transfers these APIs back to the browser for execution. Once executed, they are placed in a queue and picked up by the event loop when the call stack is clear, ensuring precise execution timing.

The event loop in JavaScript runtime includes:

- Task Queue (or Macrotask Queue, Event Queue, Callback Queue): Stores asynchronous callbacks like setTimeout.
- Microtask Queue (or Job Queue): Stores asynchronous callbacks from Promises, async/await, process.nextTick, object.observe, MutationObserver, and ensures quick processing at the end of each cycle.
- Animation Frames (or Render Queue): Holds requestAnimationFrame callbacks for rendering tasks.

---

## References

<a href="https://serhiikoziy.medium.com/event-loop-in-chrome-browser-72bd6c8db033" target="_blank">Event Loop in Chrome browser</a><br>
<a href="https://blog.xnim.me/event-loop-and-render-queue" target="_blank">Browser Event loop: micro and macro tasks, call stack, render queue: layout, paint, composite</a><br>
<a href="https://www.youtube.com/watch?v=8aGhZQkoFbQ" target="_blank">What the heck is the event loop anyway? | Philip Roberts | JSConf EU</a><br>
<a href="https://www.youtube.com/watch?v=cCOL7MC4Pl0" target="_blank">Jake Archibald: IN THE LOOP - JSConf.Asia</a><br>
<a href="https://developer.chrome.com/blog/inside-browser-part1/" target="_blank">Inside look at modern web browser (part 1)</a><br>
<a href="https://dev.to/darken/javascript-and-the-event-loop-5dpb" target="_blank">JavaScript and the event queue!</a><br>
<a href="https://www.youtube.com/watch?v=eiC58R16hb8" target="_blank">JavaScript Visualized - Event Loop, Web APIs, (Micro)task Queue</a><br>
