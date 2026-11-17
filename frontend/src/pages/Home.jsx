import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api, { resumeDownloadUrl } from "../api.js";
import { Reveal, Terminal, SectionTitle, Spinner } from "../components/ui.jsx";
import Typewriter from "../components/Typewriter.jsx";
import "@fortawesome/fontawesome-free/css/all.min.css";

const slug = (s = "") =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

// Buttons for an optional document: uploaded file and/or separate link
function DocButtons({ label, file, link }) {
  if (!file && !link) return null;
  return (
    <>
      {file && (
        <a href={file} target="_blank" rel="noreferrer" className="btn btn-sm">
          {label} ↗
        </a>
      )}
      {link && (
        <a href={link} target="_blank" rel="noreferrer" className="btn btn-sm">
          {label}
          {file ? " (link)" : ""} ↗
        </a>
      )}
    </>
  );
}

// ---- experience highlights: headings, project titles and tech chips are detected automatically ----
const isHeading = (b) =>
  /^##\s+/.test(b) ||
  (b.length <= 30 && !/[.:;,]$/.test(b) && b.trim().split(/\s+/).length <= 3);

function parseBullet(raw) {
  let text = raw.trim();
  let title = "";
  let chips = [];

  // "Project name (type): description"
  const t = text.match(/^(.{3,80}?):\s+([\s\S]+)$/);
  if (t && !/[.;]/.test(t[1].replace(/\w\.\w/g, ""))) {
    title = t[1];
    text = t[2];
  }

  // trailing "... sentence. React, Node, MongoDB" -> chips
  const i = text.lastIndexOf(". ");
  if (i > 20) {
    const tail = text.slice(i + 2);
    const items = tail.split(",").map((x) => x.trim());
    if (
      items.length >= 2 &&
      items.length <= 8 &&
      !/\.$/.test(tail) &&
      items.every((x) => x && x.length <= 24 && !/\.\s|;/.test(x))
    ) {
      chips = items;
      text = text.slice(0, i + 1);
    }
  }
  return { title, text, chips };
}

function Highlights({ bullets = [] }) {
  return (
    <div className="mt-4 space-y-2.5 text-sm text-slate-400">
      {bullets.map((b, i) => {
        if (isHeading(b)) {
          return (
            <p
              key={i}
              className="pt-4 font-mono text-xs uppercase tracking-widest text-neon first:pt-0"
            >
              // {b.replace(/^##\s+/, "")}
            </p>
          );
        }
        const { title, text, chips } = parseBullet(b);
        if (title) {
          return (
            <div
              key={i}
              className="rounded-lg border border-line bg-soft p-3.5"
            >
              <p className="font-semibold text-white">{title}</p>
              <p className="mt-1 leading-relaxed">{text}</p>
              {chips.length > 0 && (
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  {chips.map((c) => (
                    <span key={c} className="chip">
                      {c}
                    </span>
                  ))}
                </div>
              )}
            </div>
          );
        }
        return (
          <p key={i} className="flex gap-2">
            <span className="font-mono text-neon">&gt;</span>
            <span>{text}</span>
          </p>
        );
      })}
    </div>
  );
}

export default function Home() {
  const [profile, setProfile] = useState(null);
  const [projects, setProjects] = useState([]);
  const [experience, setExperience] = useState([]);
  const [certs, setCerts] = useState([]);
  const [error, setError] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get("/profile"),
      api.get("/projects"),
      api.get("/experience"),
      api.get("/certificates"),
    ])
      .then(([p, pr, ex, c]) => {
        setProfile(p.data);
        setProjects(pr.data);
        setExperience(ex.data);
        setCerts(c.data);
      })
      .catch(() => setError(true));
  }, []);

  const words = useMemo(
    () =>
      [
        ...new Set([
          // profile?.title,
          "Java Full Stack Developer",
          "Full Stack Developer (MERN)",
          "MERN Stack Developer",
          "REST API Builder",
          "Problem Solver",
        ]),
      ].filter(Boolean),
    [profile?.title],
  );

  if (error)
    return (
      <div className="grid min-h-screen place-items-center px-5 text-center font-mono text-slate-400">
        <p>
          <span className="text-red-400">Error:</span> could not load portfolio.
          Is the backend running?
        </p>
      </div>
    );
  if (!profile)
    return (
      <div className="grid min-h-screen place-items-center">
        <Spinner />
      </div>
    );

  const handle = slug((profile.name || "dev").split(" ")[0]) || "dev";

  const icons = {
  github: "fa-brands fa-github",
  linkedin: "fa-brands fa-linkedin",
  leetcode: "fa-solid fa-code",
};

  const links = [
    ["github", profile.github],
    ["linkedin", profile.linkedin],
    ["leetcode", profile.leetcode],
  ].filter(([, url]) => url);

  const nav = [
    ["skills", "skills"],
    ["experience", "experience"],
    ["projects", "projects"],
    ["education", "education"],
    ["contact", "contact"],
  ];

  return (
    <>
      {/* NAV */}
      <header className="sticky top-0 z-30 border-b border-line bg-ink/80 backdrop-blur">
        <div className="container-x flex h-14 items-center justify-between">
          <a href="#top" className="font-extrabold text-xl text-neon">
            ZS
            {/* {handle} */}
            {/* <span className="text-slate-500">@portfolio</span> */}
            :~$
          </a>
          <nav className="hidden gap-6 font-mono text-sm text-slate-400 md:flex">
            {nav.map(([id, label]) => (
              <a
                key={id}
                href={`#${id}`}
                className="transition hover:text-neon"
              >
                ./{label}
              </a>
            ))}
          </nav>
          {profile.hasResume && (
            <a href={resumeDownloadUrl} className="btn btn-sm btn-primary">
              resume.pdf ↓
            </a>
          )}
        </div>
      </header>

      <main id="top">
        {/* HERO */}
        <section className="relative overflow-hidden">
          <div className="pointer-events-none absolute inset-0 bg-grid [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]" />
          <div className="pointer-events-none absolute -top-32 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-neon/10 blur-3xl" />

          <div className="container-x relative grid items-center gap-12 py-20 lg:grid-cols-2 lg:py-28">
            <div className="animate-fade-up">
              <p className="font-mono text-sm text-neon">$ whoami</p>
              <h1 className="text-glow mt-3 text-2xl font-extrabold tracking-tight text-white sm:text-4xl">
                {profile.name}
              </h1>
              <p className="mt-4 min-h-[2rem] font-mono text-lg text-cyan2 sm:text-2xl">
                &gt; <Typewriter words={words} />
              </p>
              <p className="mt-6 max-w-xl leading-relaxed text-slate-400">
                {profile.summary}
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <a href="#projects" className="btn btn-primary">
                  ./view-projects
                </a>
                {profile.hasResume && (
                  <a href={resumeDownloadUrl} className="btn border-slate">
                    ./download-resume ↓
                  </a>
                )}
              </div>

              <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-2 font-mono text-sm">
                {links.map(([label, url]) => (
                  // <a
                  //   key={label}
                  //   href={url}
                  //   target="_blank"
                  //   rel="noreferrer"
                  //   className="text-slate transition hover:text-neon"
                  // >
                  //   [{label} ↗]
                  // </a>
                  <a
    key={label}
    href={url}
    target="_blank"
    rel="noreferrer"
    aria-label={label}
    className="text-slate transition hover:text-neon"
  >
    [<i className={`${icons[label]} text-[11px]`} aria-hidden="true"></i> {label} ↗]
  </a>
                ))}
                {profile.phone && (
                  <a
                    href={`tel:${profile.phone.replace(/\s+/g, "")}`}
                    className="text-slate-400 transition hover:text-neon"
                  >
                    {profile.phone}
                  </a>
                )}
                {profile.location && (
                  <span className="text-slate">📍{profile.location}</span>
                )}
              </div>
            </div>

            <div className="animate-fade-up [animation-delay:150ms]">
              <Terminal
                title="developer.js"
                bodyClass="p-5 font-mono text-[13px] leading-7 sm:text-sm"
              >
                <p>
                  <span className="text-violet2">const</span>{" "}
                  <span className="text-cyan2">developer</span>{" "}
                  <span className="text-slate-500">=</span> {"{"}
                </p>
                <p className="pl-5">
                  name: <span className="text-amber2">"{profile.name}"</span>,
                </p>
                <p className="pl-5">
                  role: <span className="text-amber2">"{profile.title}"</span>,
                </p>
                <p className="pl-5">
                  stack: [
                  {["React", "Node", "Express", "MongoDB", "Java", "Spring Boot", "PostgreSQL"].map((s, i, a) => (
                    <span key={s}>
                      <span className="text-amber2">"{s}"</span>
                      {i < a.length - 1 && ", "}
                    </span>
                  ))}
                  ],
                </p>
                {profile.location && (
                  <p className="pl-5">
                    location:
                    <span className="text-amber2">"{profile.location}"</span>,
                  </p>
                )}
                <p className="pl-5">
                  openToWork: <span className="text-neon">true</span>,
                </p>
                <p>{"};"}</p>
                <p className="mt-3 text-slate-500">
                  // let's build something great together
                </p>
              </Terminal>
            </div>
          </div>
        </section>

        {/* SKILLS */}
        <section id="skills" className="container-x py-16">
          <Reveal>
            <SectionTitle cmd="ls ~/skills">Tech stack</SectionTitle>
          </Reveal>
          <div className="grid gap-5 md:grid-cols-2">
            {profile.skills?.map((g) => (
              <Reveal key={g.category}>
                <Terminal
                  title={`~/skills/${slug(g.category)}`}
                  className="h-full"
                >
                  <div className="flex flex-wrap gap-2">
                    {g.items.map((s) => (
                      <span key={s} className="chip">
                        {s}
                      </span>
                    ))}
                  </div>
                </Terminal>
              </Reveal>
            ))}
          </div>
        </section>

        {/* EXPERIENCE */}
        <section id="experience" className="container-x py-16">
          <Reveal>
            <SectionTitle cmd="git log --experience">Experience</SectionTitle>
          </Reveal>
          {experience.length === 0 && (
            <p className="font-mono text-slate-500">// nothing here yet</p>
          )}
          <div className="relative space-y-8 border-l border-line pl-6">
            {experience.map((x) => (
              <Reveal key={x._id} className="relative">
                <span className="absolute -left-[31px] top-5 h-3 w-3 rounded-full border-2 border-neon bg-ink" />
                <Terminal title={`commit · ${slug(x.company || x.role)}`}>
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <h3 className="text-lg font-semibold text-white">
                        {x.role}
                      </h3>
                      <p className="font-mono text-sm text-neon">
                        @ {x.company}
                      </p>
                    </div>
                    <span className="rounded-md border border-line bg-soft px-2 py-1 font-mono text-xs text-slate-400">
                      {x.period}
                    </span>
                  </div>
                  <Highlights bullets={x.bullets} />
                  <div className="mt-5 flex flex-wrap gap-2">
                    <DocButtons
                      label="Certificate"
                      file={x.certificateFileUrl}
                      link={x.certificateLink}
                    />
                    <DocButtons
                      label="LOR"
                      file={x.lorFileUrl}
                      link={x.lorLink}
                    />
                  </div>
                </Terminal>
              </Reveal>
            ))}
          </div>
        </section>

        {/* PROJECTS */}
        <section id="projects" className="container-x py-16">
          <Reveal>
            <SectionTitle cmd="ls ~/projects">Projects</SectionTitle>
          </Reveal>
          {projects.length === 0 && (
            <p className="font-mono text-slate-500">// nothing here yet</p>
          )}
          <div className="grid gap-5 lg:grid-cols-2">
            {projects.map((p) => (
              <Reveal key={p._id}>
                <Terminal
                  title={`${slug(p.title).slice(0, 40)}.js`}
                  className="h-full"
                  bodyClass="flex h-full flex-col"
                >
                  {p.imageUrl && (
                    <img
                      src={p.imageUrl}
                      alt={p.title}
                      loading="lazy"
                      className="aspect-video w-full border-b border-line object-cover"
                    />
                  )}
                  <div className="flex flex-1 flex-col gap-3 p-5">
                    <h3 className="text-lg font-semibold text-white">
                      {p.title}
                    </h3>
                    {p.description && (
                      <p className="text-sm text-slate-400">{p.description}</p>
                    )}
                    <ul className="space-y-1.5 text-sm text-slate-400">
                      {p.bullets?.map((b, i) => (
                        <li key={i} className="flex gap-2">
                          <span className="font-mono text-neon">+</span>
                          <span>{b}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="flex flex-wrap gap-2">
                      {p.techStack?.map((t) => (
                        <span key={t} className="chip">
                          {t}
                        </span>
                      ))}
                    </div>
                    <div className="flex flex-wrap gap-2 mt-auto pt-3 mb-10">
                       {p.githubUrl && (
                        <a
                          href={p.githubUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="btn btn-sm"
                        >
                          &lt;/&gt; Code
                        </a>
                      )}
                      {p.liveUrl && (
                        <a
                          href={p.liveUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="btn btn-sm btn-primary"
                        >
                          Live demo ↗
                        </a>
                      )}
                    </div>
                  </div>
                </Terminal>
              </Reveal>
            ))}
          </div>
        </section>

        {/* EDUCATION + CERTIFICATES */}
        <section
          id="education"
          className="container-x grid gap-8 py-16 md:grid-cols-2"
        >
          <Reveal>
            <SectionTitle cmd="cat education.txt">Education</SectionTitle>
            <div className="space-y-4">
              {profile.education?.map((e, i) => (
                <Terminal key={i} title="education.txt">
                  <h3 className="font-semibold text-white">{e.degree}</h3>
                  <p className="text-sm text-slate-400">
                    {e.school}
                    {e.year && (
                      <span className="font-mono text-neon"> · {e.year}</span>
                    )}
                  </p>
                </Terminal>
              ))}
            </div>
          </Reveal>
          <Reveal>
            <SectionTitle cmd="ls ~/certificates">Certifications</SectionTitle>
            <div className="space-y-4">
              {certs.length === 0 && (
                <p className="font-mono text-slate-500">// nothing here yet</p>
              )}
              {certs.map((c) => (
                <Terminal key={c._id} title={`${slug(c.title)}.cert`}>
                  <h3 className="font-semibold text-white">{c.title}</h3>
                  {(c.issuer || c.issueDate) && (
                    <p className="text-sm text-slate-400">
                      {[c.issuer, c.issueDate].filter(Boolean).join(" · ")}
                    </p>
                  )}
                  <div className="mt-3 flex flex-wrap gap-2">
                    <DocButtons
                      label="View certificate"
                      file={c.fileUrl}
                      link={c.link}
                    />
                  </div>
                </Terminal>
              ))}
            </div>
          </Reveal>
        </section>

        {/* CONTACT */}
        <section id="contact" className="container-x py-16">
          <Reveal>
            <SectionTitle cmd="./contact.sh">Let's work together</SectionTitle>
            <Terminal
              title="contact.sh"
              bodyClass="p-6 font-mono text-sm leading-7"
            >
              <p className="text-slate-500">
                # Open to full-time and internship opportunities in Full Stack Development, MERN Stack, and Java Full Stack roles.
              </p>
              {profile.email && (
                <p>
                  <span className="text-violet2">email</span>=
                  <a
                    className="text-amber2 hover:underline"
                    href={`mailto:${profile.email}`}
                  >
                    "{profile.email}"
                  </a>
                </p>
              )}
              {profile.phone && (
                <p>
                  <span className="text-violet2">phone</span>=
                  <a
                    className="text-amber2 hover:underline"
                    href={`tel:${profile.phone.replace(/\s+/g, "")}`}
                  >
                    "{profile.phone}"
                  </a>
                </p>
              )}
              {profile.location && (
                <p>
                  <span className="text-violet2">location</span>=
                  <span className="text-amber2">"{profile.location}"</span>
                </p>
              )}
              <div className="mt-5 flex flex-wrap gap-3 font-sans">
                {profile.email && (
                  <a
                    className="btn btn-primary"
                    href={`mailto:${profile.email}`}
                  >
                    Say hello
                  </a>
                )}
                {profile.phone && (
                  <a
                    className="btn"
                    href={`tel:${profile.phone.replace(/\s+/g, "")}`}
                  >
                    Call me
                  </a>
                )}
                {profile.hasResume && (
                  <a className="btn" href={resumeDownloadUrl}>
                    Download resume ↓
                  </a>
                )}
              </div>
            </Terminal>
          </Reveal>
        </section>
      </main>

      <footer className="border-t border-line py-6">
        <div className="container-x flex items-center justify-between font-mono text-xs text-slate-500">
          <span>
            // © {new Date().getFullYear()} {profile.name} 
            {/* · built with MERN + */}
            {/* Tailwind */}
          </span>
          <Link to="/admin" className="transition hover:text-neon">
            admin
          </Link>
        </div>
      </footer>
    </>
  );
}
