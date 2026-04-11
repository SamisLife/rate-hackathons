package main

import (
	"crypto/rand"
	"database/sql"
	"encoding/json"
	"fmt"
	"html"
	"io"
	"log"
	"math"
	"math/big"
	"net/http"
	"os"
	"path/filepath"
	"regexp"
	"strings"
	"sync"
	"time"

	"github.com/PuerkitoBio/goquery"
	_ "github.com/lib/pq"
)

// word list for key phrases
var wordList = []string{
	"apple", "atlas", "bacon", "badge", "blast", "blaze", "brave", "brick",
	"brook", "brush", "cabin", "cable", "camel", "cedar", "chalk", "charm",
	"chess", "cider", "civic", "clamp", "clash", "clean", "cliff", "clock",
	"clone", "cloud", "cobra", "comet", "coral", "crane", "creek", "crisp",
	"cross", "crown", "curve", "delta", "depot", "derby", "disco", "diver",
	"dizzy", "dodge", "dowel", "draft", "drain", "drake", "drape", "drift",
	"drill", "droid", "drove", "dune", "eagle", "easel", "ebony", "elder",
	"elect", "ember", "envoy", "epoch", "ergot", "ether", "evoke", "exact",
	"fable", "facet", "fancy", "feast", "fence", "ferry", "fetch", "fiber",
	"field", "fifth", "fjord", "flare", "flask", "fleck", "fleet", "flesh",
	"flint", "float", "flock", "flood", "flora", "floss", "flute", "focal",
	"folio", "forge", "forte", "forum", "frail", "frame", "frank", "frond",
	"frost", "froze", "frugal", "fungi", "funky", "fused", "gavel", "genre",
	"glade", "glare", "glass", "gleam", "glide", "glint", "globe", "gloom",
	"gloss", "glove", "glyph", "gnome", "grace", "grade", "grain", "grand",
	"grant", "grape", "grasp", "gravel", "graze", "greed", "greet", "grind",
	"groan", "grove", "growl", "gruel", "guard", "guava", "guild", "guile",
	"guise", "gulch", "gusty", "hatch", "haven", "hazel", "heist", "helix",
	"herbs", "hinge", "hippo", "hoist", "holly", "honey", "honor", "hopeful",
	"hound", "hover", "hunch", "hydra", "hyena", "igloo", "imply", "inert",
	"infix", "ingot", "inlet", "inset", "inter", "intro", "irate", "ivory",
	"jaunt", "jewel", "joust", "juice", "jumbo", "kayak", "kelp", "knack",
	"kneel", "knife", "knoll", "koala", "kudos", "lance", "larch", "laser",
	"latch", "latte", "lathe", "lemon", "level", "light", "lilac", "linen",
	"lingo", "liver", "llama", "lodge", "lofty", "logic", "lotus", "lucid",
	"lunar", "lusty", "lyric", "magic", "magma", "maple", "march", "marsh",
	"match", "maxim", "media", "merit", "metal", "micro", "mirth", "moist",
	"molar", "moose", "moral", "mossy", "motif", "mount", "mourn", "mulch",
	"mural", "musty", "naive", "nerve", "nettle", "nexus", "niche", "noble",
	"nomad", "north", "notch", "novel", "nymph", "oaken", "oasis", "octet",
	"olive", "onyx", "optic", "orbit", "otter", "outdo", "oxide", "ozone",
	"padlock", "paint", "panda", "panel", "parka", "pasta", "paste", "patch",
	"patio", "paved", "pearl", "pedal", "perch", "phase", "piano", "pilot",
	"pinch", "pixel", "pizza", "place", "plain", "plaid", "plane", "plank",
	"plant", "plaza", "pluck", "plumb", "plume", "plunge", "plush", "polar",
	"porch", "posit", "pouch", "pound", "prawn", "pride", "prime", "prism",
	"probe", "prone", "prong", "prose", "proxy", "prune", "psalm", "pulse",
	"punch", "pupil", "purge", "quail", "quake", "qualm", "quart", "query",
	"queue", "quota", "quote", "rabbi", "radar", "radix", "radon", "rainy",
	"rally", "ramen", "ranch", "rapid", "raspy", "raven", "reach", "realm",
	"rebus", "recast", "relic", "remix", "resin", "retro", "ridge", "rifle",
	"rivet", "robot", "rocky", "rodeo", "rouge", "rough", "rowan", "rowdy",
	"royal", "rugby", "ruler", "rumba", "rusty", "safari", "sagas", "salsa",
	"sandy", "satin", "sauce", "sauna", "scald", "scalp", "scant", "scarf",
	"scene", "scone", "scoop", "scope", "scout", "scribe", "scrub", "seabird",
	"serum", "setup", "seven", "shack", "shade", "shaft", "shale", "shank",
	"shelf", "shell", "shift", "shoal", "shore", "shred", "sigma", "silky",
	"sinew", "siren", "sixth", "skate", "slant", "slick", "slime", "slope",
	"sloth", "slump", "smash", "smelt", "smoke", "snail", "snare", "sneak",
	"snipe", "solar", "solid", "solve", "sonic", "space", "spark", "spawn",
	"spell", "spice", "spire", "spore", "spout", "spray", "sprig", "sprint",
	"spunk", "squad", "squid", "stack", "staff", "staid", "stair", "stake",
	"stale", "stall", "stamp", "steed", "steel", "steep", "steer", "stern",
	"stiff", "stilts", "stoic", "stomp", "stone", "stood", "storm", "story",
	"stout", "straw", "strewn", "strip", "strut", "study", "stump", "style",
	"suede", "sugar", "suite", "sulky", "sunny", "super", "surge", "swamp",
	"swarm", "swift", "swirl", "swoop", "tabby", "table", "talon", "tapir",
	"taunt", "tawny", "taxis", "tenet", "tepid", "terra", "terse", "thane",
	"thatch", "theta", "thick", "thine", "thorn", "threw", "throb", "thumb",
	"tiara", "tidal", "tiger", "tilts", "timid", "titan", "totem", "toxic",
	"trace", "track", "trade", "trail", "train", "trait", "tramp", "trawl",
	"tread", "trend", "triad", "tribe", "tripe", "trite", "troll", "tromp",
	"trout", "trove", "truce", "truck", "trump", "truss", "trust", "tuber",
	"tulip", "tuner", "turbo", "tutor", "tweed", "twirl", "umbra", "unify",
	"union", "unity", "unlit", "unzip", "upset", "urban", "usher", "valid",
	"value", "valve", "vapor", "vault", "vegan", "vigor", "viper", "viral",
	"vista", "vital", "vivid", "vocal", "vodka", "volar", "vortex", "waltz",
	"waste", "watch", "water", "weave", "wedge", "welch", "whack", "whale",
	"wheat", "wheel", "while", "whirl", "whisk", "whole", "wield", "winch",
	"witch", "witty", "woken", "world", "wreck", "wrist", "yacht", "yearn",
	"yield", "young", "zappy", "zebra", "zenith", "zesty", "zilch", "zippy",
}

// nonAlphaRe strips everything except lowercase letters — used for hackathon
// name normalization so "HackMIT 2024", "Hack MIT", "MLH HackMIT" all collapse
// to the same canonical form for comparison.
var nonAlphaRe = regexp.MustCompile(`[^a-z]+`)

// pgDB is the active database connection, set in main().
var pgDB *sql.DB

// allowedOrigin is the CORS origin. Set ALLOWED_ORIGIN in production.
var allowedOrigin = func() string {
	if o := os.Getenv("ALLOWED_ORIGIN"); o != "" {
		return o
	}
	return "http://localhost:3000"
}()

func withCORS(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", allowedOrigin)
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
		w.Header().Set("Access-Control-Max-Age", "600")

		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}

		next(w, r)
	}
}

// In-memory challenge store (THIS IS TEMPORARY)

type Challenge struct {
	Username  string    `json:"username"`
	Phrase    string    `json:"phrase"`
	ExpiresAt time.Time `json:"expires_at"`
}

type ChallengeStore struct {
	mu     sync.RWMutex
	byUser map[string]*Challenge
}

func NewChallengeStore() *ChallengeStore {
	cs := &ChallengeStore{byUser: make(map[string]*Challenge)}
	go cs.reapExpired()
	return cs
}

// Set overwrites any existing challenge for a username
func (cs *ChallengeStore) Set(c *Challenge) {
	cs.mu.Lock()
	defer cs.mu.Unlock()
	cs.byUser[strings.ToLower(c.Username)] = c
}

// Get returns the challenge for a username, or nil if absent or expired
func (cs *ChallengeStore) Get(username string) *Challenge {
	cs.mu.RLock()
	defer cs.mu.RUnlock()
	c, ok := cs.byUser[strings.ToLower(username)]
	if !ok {
		return nil
	}
	if time.Now().After(c.ExpiresAt) {
		return nil // treat expired as absent
	}
	return c
}

// Delete removes a challenge entry explicitly (for example after successful verification)
func (cs *ChallengeStore) Delete(username string) {
	cs.mu.Lock()
	defer cs.mu.Unlock()
	delete(cs.byUser, strings.ToLower(username))
}

// reapExpired runs every minute and removes stale entries.
func (cs *ChallengeStore) reapExpired() {
	ticker := time.NewTicker(1 * time.Minute)
	defer ticker.Stop()
	for range ticker.C {
		now := time.Now()
		cs.mu.Lock()
		for k, c := range cs.byUser {
			if now.After(c.ExpiresAt) {
				delete(cs.byUser, k)
			}
		}
		cs.mu.Unlock()
	}
}

// seed phrase generation

// generatePhrase picks n cryptographically random words from the word list
func generatePhrase(n int) (string, error) {
	words := make([]string, n)
	for i := 0; i < n; i++ {
		idx, err := rand.Int(rand.Reader, big.NewInt(int64(len(wordList))))
		if err != nil {
			return "", fmt.Errorf("failed to generate random index: %w", err)
		}
		words[i] = wordList[idx.Int64()]
	}
	return strings.Join(words, " "), nil
}

// DevPost scraping

func getDevpostBio(profileURL string) (string, error) {
	client := &http.Client{Timeout: 10 * time.Second}

	req, err := http.NewRequest("GET", profileURL, nil)
	if err != nil {
		return "", fmt.Errorf("failed to create request: %w", err)
	}
	req.Header.Set("User-Agent", "Mozilla/5.0 (compatible; DevpostVerifier/1.0)")

	resp, err := client.Do(req)
	if err != nil {
		return "", fmt.Errorf("failed to fetch profile page: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("unexpected status code: %d", resp.StatusCode)
	}

	doc, err := goquery.NewDocumentFromReader(resp.Body)
	if err != nil {
		return "", fmt.Errorf("failed to parse HTML: %w", err)
	}

	bioSelection := doc.Find("p#portfolio-user-bio i").First()
	if bioSelection.Length() == 0 {
		return "", fmt.Errorf("bio element not found")
	}

	bio := strings.TrimSpace(bioSelection.Text())
	bio = html.UnescapeString(bio)
	if bio == "" {
		return "", fmt.Errorf("bio is empty")
	}

	return bio, nil
}


// devpostProfileURL builds the canonical Devpost profile URL for a username.
func devpostProfileURL(username string) string {
	return "https://devpost.com/" + strings.TrimPrefix(username, "@")
}

func writeJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(v) //nolint:errcheck
}

// normPhrase lowercases and collapses all whitespace so comparisons are
// tolerant of minor copy-paste differences.
func normPhrase(s string) string {
	return strings.Join(strings.Fields(strings.ToLower(s)), " ")
}


var store = NewChallengeStore()


func healthHandler(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, map[string]bool{"ok": true})
}

// GET /bio?url=<devpost-profile-url>
//
// Returns the raw bio text for any Devpost profile URL.
func bioHandler(w http.ResponseWriter, r *http.Request) {
	profileURL := r.URL.Query().Get("url")
	if profileURL == "" {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "missing url query param"})
		return
	}

	bio, err := getDevpostBio(profileURL)
	if err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": err.Error()})
		return
	}

	writeJSON(w, http.StatusOK, map[string]string{"bio": bio})
}

// POST /challenge
//
// Request body (JSON):
//
//	{ "username": "jdoe" }
//
// Response (201 Created):
//
//	{
//	  "username":   "jdoe",
//	  "phrase":     "coral swift plank ember nova",
//	  "expires_at": "2025-04-09T14:32:00Z"
//	}
//
// Calling this a second time for the same username replaces the previous challenge.
func challengeHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		writeJSON(w, http.StatusMethodNotAllowed, map[string]string{"error": "use POST"})
		return
	}

	var body struct {
		Username string `json:"username"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil || strings.TrimSpace(body.Username) == "" {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "body must be JSON with a non-empty username field"})
		return
	}

	phrase, err := generatePhrase(5) // 5 random words ≈ comfortable to paste
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "failed to generate phrase"})
		return
	}

	c := &Challenge{
		Username:  strings.TrimSpace(body.Username),
		Phrase:    phrase,
		ExpiresAt: time.Now().UTC().Add(10 * time.Minute),
	}
	store.Set(c)

	writeJSON(w, http.StatusCreated, c)
}

// GET /verify?username=<devpost-username>
//
// Fetches the live Devpost bio for the username, then checks whether it
// contains (or equals) the stored seed phrase.
//
// Response on match (200 OK):
//
//	{ "verified": true,  "username": "jdoe" }
//
// Response on mismatch (200 OK, verified=false):
//
//	{ "verified": false, "username": "jdoe", "reason": "bio does not contain the phrase" }
//
// Other error states use 4xx / 5xx with an "error" key.
func verifyHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		writeJSON(w, http.StatusMethodNotAllowed, map[string]string{"error": "use GET"})
		return
	}

	username := strings.TrimSpace(r.URL.Query().Get("username"))
	if username == "" {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "missing username query param"})
		return
	}

	// Look up the challenge.
	challenge := store.Get(username)
	if challenge == nil {
		writeJSON(w, http.StatusNotFound, map[string]string{
			"error": "no active challenge for this username – it may have expired or was never created",
		})
		return
	}

	// Fetch Devpost bio.
	bio, err := getDevpostBio(devpostProfileURL(username))
	if err != nil {
		writeJSON(w, http.StatusBadGateway, map[string]string{
			"error": fmt.Sprintf("could not fetch Devpost profile: %s", err.Error()),
		})
		return
	}

	// We check containment (not equality) so users can have other text in their bio.
	if strings.Contains(normPhrase(bio), normPhrase(challenge.Phrase)) {
		// Clean up immediately so the phrase can't be replayed.
		store.Delete(username)
		writeJSON(w, http.StatusOK, map[string]any{
			"verified": true,
			"username": challenge.Username,
		})
		return
	}

	writeJSON(w, http.StatusOK, map[string]any{
		"verified": false,
		"username": challenge.Username,
		"reason":   "bio does not contain the phrase",
	})
}



// ── Hackathon scraper ─────────────────────────────────────────────────────────

type ScrapedHackathon struct {
	ID           string `json:"id"`
	Name         string `json:"name"`
	URL          string `json:"url"`
	ImageURL     string `json:"imageUrl"`
	ImageAlt     string `json:"imageAlt"`
	Location     string `json:"location"`
	Description  string `json:"description"`
	Prize        string `json:"prize"`
	DateRange    string `json:"dateRange"`
	Participants string `json:"participants"`
}

func scrapeUserHackathons(devpostUsername string) ([]ScrapedHackathon, error) {
	targetURL := "https://devpost.com/" + strings.TrimPrefix(devpostUsername, "@") + "/challenges"
	client := &http.Client{Timeout: 15 * time.Second}

	req, err := http.NewRequest("GET", targetURL, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}
	req.Header.Set("User-Agent", "Mozilla/5.0 (compatible; HackRank/1.0)")
	req.Header.Set("Accept", "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8")

	resp, err := client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch challenges page: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("devpost returned status %d", resp.StatusCode)
	}

	doc, err := goquery.NewDocumentFromReader(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to parse HTML: %w", err)
	}

	var hackathons []ScrapedHackathon

	doc.Find("article.challenge-listing").Each(func(_ int, article *goquery.Selection) {
		h := ScrapedHackathon{}
		h.ID, _ = article.Attr("data-id")

		link := article.Find("a.clearfix").First()
		h.URL, _ = link.Attr("href")

		img := article.Find("img.thumbnail_image").First()
		src, _ := img.Attr("src")
		if strings.HasPrefix(src, "//") {
			src = "https:" + src
		}
		h.ImageURL = src
		h.ImageAlt, _ = img.Attr("alt")

		h.Name = strings.TrimSpace(article.Find("h2.title").First().Text())

		locSel := article.Find("p.challenge-location").First().Clone()
		locSel.Find("i").Remove()
		h.Location = strings.TrimSpace(locSel.Text())

		h.Description = strings.TrimSpace(article.Find("p.challenge-description").First().Text())

		article.Find("ul.no-bullet li").Each(func(_ int, li *goquery.Selection) {
			icon := li.Find("i").First()
			cls, _ := icon.Attr("class")

			if li.HasClass("stat") {
				content := strings.Join(strings.Fields(li.Find(".stat-content").Text()), " ")
				if strings.Contains(cls, "fa-trophy") {
					h.Prize = content
				} else if strings.Contains(cls, "fa-clock") {
					h.DateRange = content
				}
			} else if strings.Contains(cls, "fa-user-friends") {
				value := strings.TrimSpace(li.Find(".value").Text())
				action := strings.TrimSpace(li.Find(".action").Text())
				h.Participants = strings.Join(strings.Fields(value+" "+action), " ")
			}
		})

		if h.Name != "" {
			hackathons = append(hackathons, h)
		}
	})

	if hackathons == nil {
		hackathons = []ScrapedHackathon{}
	}
	return hackathons, nil
}

// GET /hackathons?username=<devpost_username>
func hackathonsHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		writeJSON(w, http.StatusMethodNotAllowed, map[string]string{"error": "use GET"})
		return
	}

	username := strings.TrimSpace(r.URL.Query().Get("username"))
	if username == "" {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "missing username query param"})
		return
	}

	hackathons, err := scrapeUserHackathons(username)
	if err != nil {
		writeJSON(w, http.StatusBadGateway, map[string]string{"error": err.Error()})
		return
	}

	writeJSON(w, http.StatusOK, map[string]any{
		"username":   username,
		"hackathons": hackathons,
	})
}

// ── Project scraper ───────────────────────────────────────────────────────────

type ScrapedProject struct {
	ID            string `json:"id"`
	Name          string `json:"name"`
	Tagline       string `json:"tagline"`
	URL           string `json:"url"`
	ImageURL      string `json:"imageUrl"`
	IsWinner      bool   `json:"isWinner"`
	HackathonURL  string `json:"hackathonUrl"`
	HackathonName string `json:"hackathonName"`
	PrizeCategory string `json:"prizeCategory"`
}

func scrapeProjectDetail(projectURL string) (hackathonURL, hackathonName, prizeCategory string) {
	client := &http.Client{Timeout: 10 * time.Second}
	req, err := http.NewRequest("GET", projectURL, nil)
	if err != nil {
		return
	}
	req.Header.Set("User-Agent", "Mozilla/5.0 (compatible; HackRank/1.0)")
	req.Header.Set("Accept", "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8")

	resp, err := client.Do(req)
	if err != nil || resp.StatusCode != http.StatusOK {
		return
	}
	defer resp.Body.Close()

	doc, err := goquery.NewDocumentFromReader(resp.Body)
	if err != nil {
		return
	}

	hackathonURL, _ = doc.Find("figure.software-list-thumbnail.challenge_avatar a").First().Attr("href")
	hackathonName = strings.TrimSpace(doc.Find("div.software-list-content p a").First().Text())

	doc.Find("div.software-list-content ul.no-bullet li").Each(func(_ int, li *goquery.Selection) {
		if li.Find("span.winner").Length() > 0 {
			li.Find("span.winner").Remove()
			prizeCategory = strings.TrimSpace(li.Text())
		}
	})
	return
}

func scrapeUserProjects(devpostUsername string) ([]ScrapedProject, error) {
	targetURL := "https://devpost.com/" + strings.TrimPrefix(devpostUsername, "@")
	client := &http.Client{Timeout: 15 * time.Second}

	req, err := http.NewRequest("GET", targetURL, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}
	req.Header.Set("User-Agent", "Mozilla/5.0 (compatible; HackRank/1.0)")
	req.Header.Set("Accept", "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8")

	resp, err := client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch profile page: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("devpost returned status %d", resp.StatusCode)
	}

	doc, err := goquery.NewDocumentFromReader(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to parse HTML: %w", err)
	}

	var projects []ScrapedProject

	doc.Find("#software-entries .gallery-item").Each(func(_ int, item *goquery.Selection) {
		p := ScrapedProject{}
		p.ID, _ = item.Attr("data-software-id")

		link := item.Find("a.block-wrapper-link").First()
		p.URL, _ = link.Attr("href")

		img := item.Find("img.software_thumbnail_image").First()
		src, _ := img.Attr("src")
		if strings.HasPrefix(src, "//") {
			src = "https:" + src
		}
		p.ImageURL = src

		p.Name = strings.TrimSpace(item.Find("h5").First().Text())
		p.Tagline = strings.TrimSpace(item.Find("p.small.tagline").First().Text())
		p.IsWinner = item.Find("aside.entry-badge img.winner").Length() > 0

		if p.Name != "" {
			projects = append(projects, p)
		}
	})

	// Fetch project detail pages in parallel (max 5 concurrent) to get hackathon info
	var wg sync.WaitGroup
	var mu sync.Mutex
	sem := make(chan struct{}, 5)

	for i := range projects {
		if projects[i].URL == "" {
			continue
		}
		wg.Add(1)
		sem <- struct{}{}
		go func(i int) {
			defer wg.Done()
			defer func() { <-sem }()
			hURL, hName, prize := scrapeProjectDetail(projects[i].URL)
			mu.Lock()
			projects[i].HackathonURL = hURL
			projects[i].HackathonName = hName
			projects[i].PrizeCategory = prize
			mu.Unlock()
		}(i)
	}
	wg.Wait()

	if projects == nil {
		projects = []ScrapedProject{}
	}
	return projects, nil
}

// GET /projects?username=<devpost_username>
func projectsHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		writeJSON(w, http.StatusMethodNotAllowed, map[string]string{"error": "use GET"})
		return
	}

	username := strings.TrimSpace(r.URL.Query().Get("username"))
	if username == "" {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "missing username query param"})
		return
	}

	projects, err := scrapeUserProjects(username)
	if err != nil {
		writeJSON(w, http.StatusBadGateway, map[string]string{"error": err.Error()})
		return
	}

	writeJSON(w, http.StatusOK, map[string]any{
		"username": username,
		"projects": projects,
	})
}

// ── Voting system ─────────────────────────────────────────────────────────────
//
// DATA_DIR is resolved once at startup.
// Override with the DATA_DIR env-var when deploying (e.g. point at a mounted
// volume or swap the whole VoteRepository for a DB-backed implementation).
var dataDir = func() string {
	if d := os.Getenv("DATA_DIR"); d != "" {
		return d
	}
	return filepath.Join("..", "..", "frontend", "data")
}()

// staticHackathon mirrors the fields we need from hackathons.json.
type staticHackathon struct {
	ID    int    `json:"id"`
	Name  string `json:"name"`
	Org   string `json:"org"`
	City  string `json:"city"`
	State string `json:"state"`
}

// attendanceCacheEntry mirrors a per-user entry in attended_hackathons.json.
type attendanceCacheEntry struct {
	DevpostUsername string             `json:"devpostUsername"`
	CachedAt        string             `json:"cachedAt"`
	Hackathons      []ScrapedHackathon `json:"hackathons"`
}

// Vote is a single persisted vote record.
type Vote struct {
	ID        string    `json:"id"`
	WinnerID  int       `json:"winnerId"`
	LoserID   int       `json:"loserId"`
	Weight    float64   `json:"weight"`
	Tier      string    `json:"tier"`
	Voter     string    `json:"voter"` // empty for anonymous
	CreatedAt time.Time `json:"createdAt"`
}

// HackathonScore is the aggregated weighted result for one hackathon.
type HackathonScore struct {
	ID            int     `json:"id"`
	RawVotes      int     `json:"rawVotes"`      // integer count of votes cast (for display)
	WeightedVotes float64 `json:"weightedVotes"` // sum of weights (for ranking)
	WeightedWins  float64 `json:"weightedWins"`  // sum of winner weights (for ranking)
	WinRate       float64 `json:"winRate"`        // weightedWins/weightedVotes×100
}

// ── VoteRepository abstraction ────────────────────────────────────────────────
//
// Swap the JSON store for any DB by implementing this two-method interface.

type VoteRepository interface {
	SaveVote(v Vote) error
	Scores() ([]HackathonScore, error)
}

// ── PostgreSQL implementation ─────────────────────────────────────────────────

type pgVoteRepo struct{ db *sql.DB }

func newPGVoteRepo(db *sql.DB) *pgVoteRepo { return &pgVoteRepo{db: db} }

func (r *pgVoteRepo) SaveVote(v Vote) error {
	_, err := r.db.Exec(
		`INSERT INTO votes (id, winner_id, loser_id, weight, tier, voter, created_at)
		 VALUES ($1,$2,$3,$4,$5,$6,$7)`,
		v.ID, v.WinnerID, v.LoserID, v.Weight, v.Tier, v.Voter, v.CreatedAt,
	)
	return err
}

func (r *pgVoteRepo) Scores() ([]HackathonScore, error) {
	const q = `
		SELECT hackathon_id,
		       COUNT(*)::int            AS raw_votes,
		       SUM(weight)              AS weighted_votes,
		       SUM(weight * is_win)     AS weighted_wins
		FROM (
		    SELECT winner_id AS hackathon_id, weight, 1.0::float8 AS is_win FROM votes
		    UNION ALL
		    SELECT loser_id  AS hackathon_id, weight, 0.0::float8 AS is_win FROM votes
		) t
		GROUP BY hackathon_id`
	rows, err := r.db.Query(q)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []HackathonScore
	for rows.Next() {
		var s HackathonScore
		var wv, ww float64
		if err := rows.Scan(&s.ID, &s.RawVotes, &wv, &ww); err != nil {
			return nil, err
		}
		s.WeightedVotes = math.Round(wv*100) / 100
		s.WeightedWins = math.Round(ww*100) / 100
		if wv > 0 {
			s.WinRate = math.Round((ww/wv)*100*100) / 100
		}
		out = append(out, s)
	}
	return out, rows.Err()
}

// ── Weight algorithm ──────────────────────────────────────────────────────────
//
// Tier hierarchy (lowest → highest credibility):
//
//   anon                  0.30  visitor with no account
//   verified_no_attend    0.60  logged-in + Devpost-linked, never attended a hackathon
//   verified_attended     0.80  logged-in, attended at least one hackathon (anywhere)
//   same_state            1.00  attended a hackathon in the same state as either target
//   same_org              1.20  attended a different hackathon at the same university/org
//   attended_one          1.50  attended exactly one of the two hackathons being compared
//   attended_both         2.20  attended both hackathons being compared (highest trust)
//
// Tiers are mutually exclusive; the highest applicable tier wins.

const (
	TierAnon             = "anon"
	TierVerifiedNoAttend = "verified_no_attend"
	TierVerifiedAttended = "verified_attended"
	TierSameState        = "same_state"
	TierSameOrg          = "same_org"
	TierAttendedOne      = "attended_one"
	TierAttendedBoth     = "attended_both"
)

var tierWeights = map[string]float64{
	TierAnon:             0.30,
	TierVerifiedNoAttend: 0.60,
	TierVerifiedAttended: 0.80,
	TierSameState:        1.00,
	TierSameOrg:          1.20,
	TierAttendedOne:      1.50,
	TierAttendedBoth:     2.20,
}

func loadStaticHackathons(dir string) ([]staticHackathon, error) {
	data, err := os.ReadFile(filepath.Join(dir, "hackathons.json"))
	if err != nil {
		return nil, err
	}
	var hacks []staticHackathon
	return hacks, json.Unmarshal(data, &hacks)
}

func loadAttendanceCache() (map[string]attendanceCacheEntry, error) {
	const q = `SELECT username, devpost_username, cached_at, hackathons FROM attendance_cache`
	rows, err := pgDB.Query(q)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	ac := make(map[string]attendanceCacheEntry)
	for rows.Next() {
		var username string
		var entry attendanceCacheEntry
		var cachedAt time.Time
		var hackJSON []byte
		if err := rows.Scan(&username, &entry.DevpostUsername, &cachedAt, &hackJSON); err != nil {
			return nil, err
		}
		entry.CachedAt = cachedAt.UTC().Format(time.RFC3339Nano)
		if err := json.Unmarshal(hackJSON, &entry.Hackathons); err != nil {
			return nil, err
		}
		ac[username] = entry
	}
	return ac, rows.Err()
}

// normHackName strips all non-letter characters and lowercases, so
// "HackMIT 2024", "Hack MIT", "MLH HackMIT" all become "hackmit".
func normHackName(s string) string {
	return nonAlphaRe.ReplaceAllString(strings.ToLower(s), "")
}

// matchesName returns true if hackName normalises to equal or be contained in
// scrapedName (or vice versa). Strips all non-letter characters before comparing.
func matchesName(hackName, scrapedName string) bool {
	normHack := normHackName(hackName)
	normScraped := normHackName(scrapedName)
	if normHack == "" || normScraped == "" {
		return false
	}
	return normScraped == normHack ||
		strings.Contains(normScraped, normHack) ||
		strings.Contains(normHack, normScraped)
}

// orgMatch checks whether a scraped hackathon name is associated with the
// given org/university. It uses two strategies:
//  1. The org string appears as a substring of the normalised scraped name.
//  2. The scraped name matches any alias of any hackathon that shares the org
//     (catches names like "HackNY" whose org is "NYU" — "nyu" ∉ "hackny").
func orgMatch(allHacks []staticHackathon, targetOrg, scrapedName string) bool {
	if len(targetOrg) < 2 || scrapedName == "" {
		return false
	}
	normOrg := normHackName(targetOrg)
	normName := normHackName(scrapedName)

	// Strategy 1: org keyword present in scraped name
	if strings.Contains(normName, normOrg) {
		return true
	}
	// Strategy 2: scraped name matches the name of a same-org hackathon
	normOrgLower := strings.ToLower(strings.TrimSpace(targetOrg))
	for _, h := range allHacks {
		if strings.ToLower(strings.TrimSpace(h.Org)) != normOrgLower {
			continue
		}
		if matchesName(h.Name, scrapedName) {
			return true
		}
	}
	return false
}

// extractState returns the two-letter US state abbreviation from a location
// string like "Cambridge, MA" or "New York, NY, USA".
// Scans comma-separated parts right-to-left for the first 2-letter segment.
func extractState(location string) string {
	parts := strings.Split(location, ",")
	for i := len(parts) - 1; i >= 0; i-- {
		s := strings.ToUpper(strings.TrimSpace(parts[i]))
		if len(s) == 2 && s[0] >= 'A' && s[0] <= 'Z' && s[1] >= 'A' && s[1] <= 'Z' {
			return s
		}
	}
	return ""
}

// WeightResult is the output of ComputeWeight.
type WeightResult struct {
	Weight float64 `json:"weight"`
	Tier   string  `json:"tier"`
}

// ComputeWeight determines the credibility weight for a vote.
// voterUsername is empty for anonymous voters.
// hackAID / hackBID are the integer IDs from hackathons.json.
func ComputeWeight(voterUsername string, hackAID, hackBID int) WeightResult {
	fallback := func(tier string) WeightResult {
		return WeightResult{Weight: tierWeights[tier], Tier: tier}
	}

	// ── Anonymous ────────────────────────────────────────────────────────────
	if voterUsername == "" {
		return fallback(TierAnon)
	}

	// ── Load reference data ───────────────────────────────────────────────────
	hacks, err := loadStaticHackathons(dataDir)
	if err != nil {
		return fallback(TierVerifiedNoAttend)
	}
	var hackA, hackB *staticHackathon
	for i := range hacks {
		switch hacks[i].ID {
		case hackAID:
			hackA = &hacks[i]
		case hackBID:
			hackB = &hacks[i]
		}
	}
	if hackA == nil || hackB == nil {
		return fallback(TierVerifiedNoAttend)
	}

	// ── Load voter attendance ─────────────────────────────────────────────────
	ac, err := loadAttendanceCache()
	if err != nil {
		return fallback(TierVerifiedNoAttend)
	}
	entry, ok := ac[voterUsername]
	if !ok || len(entry.Hackathons) == 0 {
		// Logged-in user with no cached attendance = never attended anything
		return fallback(TierVerifiedNoAttend)
	}
	attended := entry.Hackathons

	// ── Tier: attended_both / attended_one ───────────────────────────────────
	var attendedA, attendedB bool
	for _, h := range attended {
		if matchesName(hackA.Name, h.Name) {
			attendedA = true
		}
		if matchesName(hackB.Name, h.Name) {
			attendedB = true
		}
	}
	if attendedA && attendedB {
		return fallback(TierAttendedBoth)
	}
	if attendedA || attendedB {
		return fallback(TierAttendedOne)
	}

	// ── Tier: same_org ───────────────────────────────────────────────────────
	// Attended a different hackathon at the same university as hackA or hackB.
	for _, h := range attended {
		// Skip if this was the same hackathon (guarded by name check above, but be safe)
		if matchesName(hackA.Name, h.Name) || matchesName(hackB.Name, h.Name) {
			continue
		}
		if orgMatch(hacks, hackA.Org, h.Name) || orgMatch(hacks, hackB.Org, h.Name) {
			return fallback(TierSameOrg)
		}
	}

	// ── Tier: same_state ─────────────────────────────────────────────────────
	for _, h := range attended {
		state := extractState(h.Location)
		if state == "" {
			continue
		}
		if state == hackA.State || state == hackB.State {
			return fallback(TierSameState)
		}
	}

	// ── Tier: verified_attended ──────────────────────────────────────────────
	// Logged-in user who has attended at least one hackathon (just not a relevant one).
	return fallback(TierVerifiedAttended)
}

// newVoteID returns a random 16-hex-char vote identifier.
func newVoteID() string {
	b := make([]byte, 8)
	if _, err := io.ReadFull(rand.Reader, b); err != nil {
		return fmt.Sprintf("%d", time.Now().UnixNano())
	}
	return fmt.Sprintf("%x", b)
}

// voteRepo is set in main() after the DB connection is established.
var voteRepo VoteRepository

// POST /vote
// Body: { "winnerId": 1, "loserId": 2, "voter": "username-or-empty" }
// Response: { "ok": true, "weight": 1.2, "tier": "attended_one" }
func voteHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		writeJSON(w, http.StatusMethodNotAllowed, map[string]string{"error": "use POST"})
		return
	}

	var body struct {
		WinnerID int    `json:"winnerId"`
		LoserID  int    `json:"loserId"`
		Voter    string `json:"voter"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil || body.WinnerID == 0 || body.LoserID == 0 {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "winnerId and loserId are required"})
		return
	}

	voter := strings.ToLower(strings.TrimSpace(body.Voter))
	wr := ComputeWeight(voter, body.WinnerID, body.LoserID)

	v := Vote{
		ID:        newVoteID(),
		WinnerID:  body.WinnerID,
		LoserID:   body.LoserID,
		Weight:    wr.Weight,
		Tier:      wr.Tier,
		Voter:     voter,
		CreatedAt: time.Now().UTC(),
	}

	if err := voteRepo.SaveVote(v); err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "failed to save vote"})
		return
	}

	writeJSON(w, http.StatusOK, map[string]any{
		"ok":     true,
		"weight": wr.Weight,
		"tier":   wr.Tier,
	})
}

// GET /scores
// Response: { "scores": [{ "id": 1, "weightedVotes": 4.2, "weightedWins": 2.8, "winRate": 66.67 }] }
func scoresHandler(w http.ResponseWriter, r *http.Request) {
	scores, err := voteRepo.Scores()
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "failed to load scores"})
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"scores": scores})
}

func migrate(db *sql.DB) error {
	const schema = `
	CREATE TABLE IF NOT EXISTS users (
		id               TEXT        PRIMARY KEY,
		username         TEXT        NOT NULL UNIQUE,
		devpost_username TEXT        NOT NULL UNIQUE,
		password_hash    TEXT        NOT NULL,
		created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
		token_jti        TEXT        NOT NULL UNIQUE
	);

	CREATE TABLE IF NOT EXISTS votes (
		id         TEXT             PRIMARY KEY,
		winner_id  INTEGER          NOT NULL,
		loser_id   INTEGER          NOT NULL,
		weight     DOUBLE PRECISION NOT NULL,
		tier       TEXT             NOT NULL,
		voter      TEXT             NOT NULL DEFAULT '',
		created_at TIMESTAMPTZ      NOT NULL DEFAULT NOW()
	);

	CREATE INDEX IF NOT EXISTS votes_winner_id_idx ON votes (winner_id);
	CREATE INDEX IF NOT EXISTS votes_loser_id_idx  ON votes (loser_id);

	CREATE TABLE IF NOT EXISTS attendance_cache (
		username         TEXT        PRIMARY KEY,
		devpost_username TEXT        NOT NULL,
		cached_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
		hackathons       JSONB       NOT NULL DEFAULT '[]'
	);

	CREATE TABLE IF NOT EXISTS projects_cache (
		username  TEXT        PRIMARY KEY,
		cached_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
		projects  JSONB       NOT NULL DEFAULT '[]'
	);`

	_, err := db.Exec(schema)
	return err
}

func main() {
	// ── Database connection ───────────────────────────────────────────────────
	dsn := os.Getenv("DATABASE_URL")
	if dsn == "" {
		log.Fatal("DATABASE_URL environment variable is required")
	}
	db, err := sql.Open("postgres", dsn)
	if err != nil {
		log.Fatalf("failed to open database: %v", err)
	}
	if err := db.Ping(); err != nil {
		log.Fatalf("failed to connect to database: %v", err)
	}
	db.SetMaxOpenConns(10)
	db.SetMaxIdleConns(5)
	pgDB = db
	voteRepo = newPGVoteRepo(db)
	log.Println("Connected to PostgreSQL")

	if err := migrate(db); err != nil {
		log.Fatalf("migration failed: %v", err)
	}
	log.Println("Schema up to date")

	// ── HTTP routes ───────────────────────────────────────────────────────────
	http.HandleFunc("/health", withCORS(healthHandler))
	http.HandleFunc("/bio", withCORS(bioHandler))
	http.HandleFunc("/challenge", withCORS(challengeHandler))
	http.HandleFunc("/verify", withCORS(verifyHandler))
	http.HandleFunc("/hackathons", withCORS(hackathonsHandler))
	http.HandleFunc("/projects", withCORS(projectsHandler))
	http.HandleFunc("/vote", withCORS(voteHandler))
	http.HandleFunc("/scores", withCORS(scoresHandler))

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	fmt.Printf("Server running on :%s\n", port)
	if err := http.ListenAndServe(":"+port, nil); err != nil {
		panic(err)
	}
}