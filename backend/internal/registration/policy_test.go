package registration

import (
	"testing"
	"time"
)

func TestParseDate(t *testing.T) {
	if _, err := parseDate("2026-02-29"); err == nil {
		t.Fatal("invalid leap day accepted")
	}
	if _, err := parseDate("2026-10-12"); err != nil {
		t.Fatal(err)
	}
	if _, err := parseDate("2026-1-2"); err == nil {
		t.Fatal("wrong format accepted")
	}
}
func TestISODay(t *testing.T) {
	// 2026-10-12 is a Monday
	date, _ := parseDate("2026-10-12")
	if got := isoDay(date); got != 1 {
		t.Fatalf("got weekday %d", got)
	}
	if date.Location() == time.UTC {
		t.Fatal("date should use VN timezone")
	}
}
func TestSlotClock(t *testing.T) {
	date, _ := parseDate("2026-10-12")
	at, err := scheduledAt(date, "13:00")
	if err != nil {
		t.Fatal(err)
	}
	if at.Hour() != 13 || at.Format(time.RFC3339) != "2026-10-12T13:00:00+07:00" {
		t.Fatalf("bad slot time %s", at)
	}
}
