// memberProfile.js
//
// Combined version: 
// - Preserves your updated UI/structural changes (two-column layout, highlight on click, etc.)
// - Relies on server-side (Redis) caching instead of localStorage
// - Maintains in-memory caching in the window.membersData array
//
// NOTE: Make sure you have the same HTML element IDs and that any calls (e.g. stateClicked, 
// updateDistrictOverlay, etc.) exist in your main map script.

let membersData = [];
window.previousMemberList = [];

// Use the same endpoint you had with Redis caching on the server side:
const MEMBERS_API = "/api/congress_members/";

// Helper: Format district numbers as two-digit strings
function formatDistrict(num) {
  return num.toString().padStart(2, "0");
}

// Function to fetch Congress members from the server (no localStorage usage).
async function fetchCongressMembers() {
  try {
    console.log("Fetching new Congress members data from API (Redis caching is on the server)...");
    const response = await fetch(MEMBERS_API);
    if (!response.ok) {
      throw new Error("Failed to fetch Congress members data");
    }
    const data = await response.json();
    window.membersData = data;
    membersData = data; // Keep a top-level reference if desired
    return data;
  } catch (error) {
    console.error("Error fetching Congress members data:", error);
    window.membersData = [];
    return [];
  }
}

// Ensure that congress members are loaded into memory before proceeding
async function ensureCongressMembersLoaded() {
  if (!window.membersData || window.membersData.length === 0) {
    console.warn("Congress members not loaded. Fetching data...");
    await fetchCongressMembers();
  }
}

// Update member profile by state (and optional district)
async function updateMemberProfile(stateID, districtNumber = null) {
  console.log(`Updating member profile for state: ${stateID}, district: ${districtNumber}`);
  await ensureCongressMembersLoaded();

  const memberDetails = document.getElementById("member-details");
  if (!memberDetails) {
    console.error("#member-details not found in the DOM!");
    return;
  }
  memberDetails.innerHTML = "";
  memberDetails.classList.remove("has-content");

  // Build an appropriate heading
  let titleHTML = `Congress Members for ${stateID}`;
  if (districtNumber != null) {
    titleHTML += ` - District ${formatDistrict(districtNumber)}`;
  }
  const titleElement = document.createElement("h4");
  titleElement.id = "member-title";
  titleElement.textContent = titleHTML;
  memberDetails.appendChild(titleElement);

  // Filter for members in the selected state
  const stateMembers = window.membersData.filter(member => member.state === stateID);

  if (stateMembers.length === 0) {
    memberDetails.innerHTML = `<p>No members found for ${stateID}.</p>`;
    return;
  }
  memberDetails.classList.add("has-content");

  // Render all relevant state members (the UI handles district highlight inside the list)
  renderMemberList(stateMembers);

  // If a district was specified, highlight those profiles
  if (districtNumber != null && !document.querySelector(".member-profile.selected-member")) {
    const formattedDistrict = formatDistrict(districtNumber);
    const memberProfiles = document.querySelectorAll(".member-profile");
    memberProfiles.forEach(profile => {
      if (profile.getAttribute("data-district") === formattedDistrict) {
        profile.classList.add("highlight");
        // Optionally scroll the matching profile into view
        profile.scrollIntoView({ behavior: "smooth", block: "nearest" });
      } else {
        profile.classList.remove("highlight");
      }
    });
  } else {
    // If a specific member is already selected, remove leftover highlighting from others
    document.querySelectorAll(".member-profile").forEach(profile => {
      if (!profile.classList.contains("selected-member")) {
        profile.classList.remove("highlight");
      }
    });
  }
}

// Dynamically render member profiles for a given list of members
function renderMemberList(members) {
  console.log("Rendering member profiles for:", members);
  const memberDetails = document.getElementById("member-details");
  if (!memberDetails) {
    console.error("Element #member-details not found in DOM!");
    return;
  }

  // Keep track of this list (so you can restore it later, if needed)
  window.previousMemberList = members;

  members.forEach(member => {
    console.log("Rendering member:", member.name);

    // District handling
    const parsedDistrict = parseInt(member.district, 10);
    const districtDisplay = (!isNaN(parsedDistrict) && member.chamber === "House of Representatives")
      ? `<span><strong>District:</strong> ${formatDistrict(parsedDistrict)}</span><br>`
      : "";

    // Create the wrapper div
    const memberDiv = document.createElement("div");
    memberDiv.classList.add("member-profile");

    // For House members, store "data-district" for easier highlight
    memberDiv.setAttribute("data-district", isNaN(parsedDistrict) ? "" : formatDistrict(parsedDistrict));

    // If it's a senator, optionally add a special class for styling
    if (member.chamber === "Senate") {
      memberDiv.classList.add("senator");
    }

    // Member image
    const img = document.createElement("img");
    img.src = member.image_url;
    img.alt = member.name;
    img.classList.add("profile-image");

    // Member info container
    const memberInfo = document.createElement("div");
    memberInfo.classList.add("member-info");

    // Left column
    const leftColumn = document.createElement("div");
    leftColumn.classList.add("left-column");
    leftColumn.innerHTML = `
      <span><strong>Name:</strong> ${member.name}</span><br>
      <span><strong>Party:</strong> ${member.party}</span><br>
      <span><strong>Chamber:</strong> ${member.chamber}</span><br>
      ${districtDisplay}
      <span><strong>Active:</strong> ${member.start_year} - Present</span><br>
      <span><strong>Bills Sponsored:</strong> ${member.sponsored_bills}</span><br>
      <span><strong>Bills Co-sponsored:</strong> ${member.cosponsored_bills}</span><br>
    `;

    // Right column
    const rightColumn = document.createElement("div");
    rightColumn.classList.add("right-column");
    rightColumn.innerHTML = `
      <span><strong>Address:</strong> ${member.address}</span><br>
      <span><strong>Phone:</strong> ${member.phone_number}</span><br>
      <span><strong>Website:</strong> <a href="${member.website_url}" target="_blank">${member.website_url}</a></span><br>
      <span><strong>Committee Assignments:</strong> ${member.committee_assignments}</span><br>
    `;

    // On click, select this member, highlight them, and possibly update the map/radar chart
    memberDiv.addEventListener("click", () => {
      console.log(`Clicked on member: ${member.name}`);
      // Remove selection/highlight from all other profiles
      document.querySelectorAll(".member-profile").forEach(el => {
        el.classList.remove("selected-member", "highlight");
      });
      // Remove any existing district overlays from the map, if that function exists
      if (typeof removeDistrictOverlays === "function") {
        removeDistrictOverlays();
      }

      // Mark this profile as selected
      memberDiv.classList.add("selected-member");

      // Store the selected member ID globally, so the radar chart can use it
      window.selectedMemberID = member.bioguide_id;
      // Show the radar chart (assuming updateRadarChart(...) is defined)
      updateRadarChart(window.selectedMemberID);

      // If House, zoom the map to that district
      if (member.chamber === "House of Representatives") {
        let districtNum = parseInt(member.district, 10);
        if (!isNaN(districtNum)) {
          const formattedDistrict = formatDistrict(districtNum);
          // The "stateDistricts" array is presumably from your map script
          let matchingDistrict = stateDistricts.find(d => {
            let dnum = parseInt(d.properties.DISTRICT, 10);
            return !isNaN(dnum) && formatDistrict(dnum) === formattedDistrict;
          });
          if (matchingDistrict) {
            console.log("Found matching district for", member.name, matchingDistrict.properties.OFFICE_ID);
            // Re-center the map
            let { minLon, maxLon, minLat, maxLat } = getGeoBounds(matchingDistrict.geometry);
            let lonCenter = (minLon + maxLon) / 2;
            let latCenter = (minLat + maxLat) / 2;
            let optimalScale = calculateZoom(minLon, maxLon, minLat, maxLat);
            Plotly.relayout("plotly-map", {
              "geo.center": { lon: lonCenter, lat: latCenter },
              "geo.projection.scale": optimalScale,
            }).then(() => {
              // Wait briefly, then highlight the overlay
              setTimeout(() => {
                updateDistrictOverlay(matchingDistrict);
              }, 200);
            });
          } else {
            console.warn("No matching district found for House member:", member.name);
          }
        }
      } else if (member.chamber === "Senate") {
        // If it's a Senator, just highlight the entire state on the map
        let matchingState = states.features.find(d => d.properties.STUSPS === member.state);
        if (matchingState) {
          stateClicked(matchingState.properties.STATEFP);
        } else {
          console.warn("No matching state found for senator:", member.name);
        }
      }
    });

    // Append columns to the container, then append to the #member-details
    memberInfo.appendChild(leftColumn);
    memberInfo.appendChild(rightColumn);
    memberDiv.appendChild(img);
    memberDiv.appendChild(memberInfo);
    memberDetails.appendChild(memberDiv);
  });

  console.log("Member profiles rendered successfully.");
}

// Restore the last member list that was rendered (if any)
function restorePreviousMemberList() {
  if (window.previousMemberList && window.previousMemberList.length > 0) {
    console.log("Restoring previous member list...");
    renderMemberList(window.previousMemberList);
  } else {
    console.warn("No previous member list to restore.");
  }
}

// (Optional) Immediately fetch data so it's ready, or you can wait until needed:
(async function initialLoad() {
  await fetchCongressMembers();
})();
