package main

import (
	"crypto/rand"
	"encoding/json"
	"fmt"
	"html"
	"math/big"
	"net/http"
	"strings"
	"sync"
	"time"

	"github.com/PuerkitoBio/goquery"
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

func withCORS(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "http://localhost:3000")
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

func main() {
	http.HandleFunc("/health", withCORS(healthHandler))
	http.HandleFunc("/bio", withCORS(bioHandler))
	http.HandleFunc("/challenge", withCORS(challengeHandler))
	http.HandleFunc("/verify", withCORS(verifyHandler))
	http.HandleFunc("/hackathons", withCORS(hackathonsHandler))
	http.HandleFunc("/projects", withCORS(projectsHandler))

	fmt.Println("Server running on http://localhost:8080")
	if err := http.ListenAndServe(":8080", nil); err != nil {
		panic(err)
	}
}