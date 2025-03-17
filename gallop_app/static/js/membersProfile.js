// memberProfile.js


let membersData = [];
window.previousMemberList = [];

const cacheKeyMembers = "congress_members_cache";
const cacheExpiryMembers = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

// Helper: Format district numbers as two-digit strings
function formatDistrict(num) {
  return num.toString().padStart(2, "0");
}

// Function to fetch Congress members from API with caching
async function fetchCongressMembers() {
  const cachedMembers = localStorage.getItem(cacheKeyMembers);
  const cachedTime = localStorage.getItem(`${cacheKeyMembers}_time`);

  if (cachedMembers && cachedTime) {
    const now = new Date().getTime();
    if (now - cachedTime < cacheExpiryMembers) {
      console.log("Using cached Congress members data.");
      membersData = JSON.parse(cachedMembers);
      window.membersData = membersData;
      return membersData;
    }
  }

  try {
    console.log("Fetching new Congress members data from API...");
    const response = await fetch("/api/congress_members/");
    if (!response.ok) throw new Error("Failed to fetch Congress members data");
    const data = await response.json();
    window.membersData = data;
    localStorage.setItem(cacheKeyMembers, JSON.stringify(data));
    localStorage.setItem(`${cacheKeyMembers}_time`, new Date().getTime());
    return data;
  } catch (error) {
    console.error("Error fetching Congress members data:", error);
    window.membersData = [];
    return [];
  }
}

// Function to update members based on state (and optional district) selection
async function updateMemberProfile(stateID, districtNumber = null) {
  console.log(`Updating member profile for state: ${stateID}, district: ${districtNumber}`);
  await ensureCongressMembersLoaded();

  const memberDetails = document.getElementById("member-details");
  memberDetails.innerHTML = "";
  memberDetails.classList.remove("has-content");

  let titleHTML = `Congress Members for ${stateID}`;
  if (districtNumber != null) {
    titleHTML += ` - District ${formatDistrict(districtNumber)}`;
  }
  const titleElement = document.createElement("h4");
  titleElement.id = "member-title";
  titleElement.textContent = titleHTML;
  memberDetails.appendChild(titleElement);

  // Filter members by state only; display all members
  const stateMembers = window.membersData.filter(member => member.state === stateID);
  if (stateMembers.length === 0) {
    memberDetails.innerHTML = `<p>No members found for ${stateID}.</p>`;
    return;
  }
  memberDetails.classList.add("has-content");

  // Render all state members
  renderMemberList(stateMembers);

  // Only add district highlight if no member is explicitly selected.
  // When a member is clicked from the list, that element gets the "selected-member" class.
  if (districtNumber != null && !document.querySelector(".member-profile.selected-member")) {
    const formattedDistrict = formatDistrict(districtNumber);
    const memberProfiles = document.querySelectorAll('.member-profile');
    memberProfiles.forEach(profile => {
      if (profile.getAttribute('data-district') === formattedDistrict) {
        profile.classList.add('highlight');
        // Scroll the first matching profile into view within its container
        profile.scrollIntoView({ behavior: "smooth", block: "nearest" });
      } else {
        profile.classList.remove('highlight');
      }
    });
  } else {
    // If a member is explicitly selected, remove any leftover 'highlight' from others.
    document.querySelectorAll('.member-profile').forEach(profile => {
      if (!profile.classList.contains('selected-member')) {
        profile.classList.remove('highlight');
      }
    });
  }
}

// Function to dynamically render member profiles
function renderMemberList(members) {
  console.log("Rendering member profiles for:", members);
  const memberDetails = document.getElementById("member-details");
  if (!memberDetails) {
    console.error("Element #member-details not found in DOM!");
    return;
  }
  window.previousMemberList = members;

  members.forEach(member => {
    console.log("Rendering member:", member.name);
    const parsedDistrict = parseInt(member.district, 10);
    const districtDisplay = (!isNaN(parsedDistrict) && member.chamber === "House of Representatives")
      ? `<span><strong>District:</strong> ${formatDistrict(parsedDistrict)}</span><br>`
      : "";
    const memberDiv = document.createElement("div");
    memberDiv.classList.add("member-profile");
    // Set district attribute as a two-digit string (or empty)
    memberDiv.setAttribute("data-district", isNaN(parsedDistrict) ? "" : formatDistrict(parsedDistrict));
    
    // If this member is a senator, add the senator class
    if (member.chamber === "Senate") {
      memberDiv.classList.add("senator");
    }

    const img = document.createElement("img");
    img.src = member.image_url;
    img.alt = member.name;
    img.classList.add("profile-image");

    const memberInfo = document.createElement("div");
    memberInfo.classList.add("member-info");

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
    const rightColumn = document.createElement("div");
    rightColumn.classList.add("right-column");
    rightColumn.innerHTML = `
      <span><strong>Address:</strong> ${member.address}</span><br>
      <span><strong>Phone:</strong> ${member.phone_number}</span><br>
      <span><strong>Website:</strong> <a href="${member.website_url}" target="_blank">${member.websiteURL}</a></span><br>
    `;

    // Click event for member selection – updates the map similarly to a district click.
    memberDiv.addEventListener("click", () => {
      console.log(`Clicked on member: ${member.name}`);
      // Clear selected-member and highlight classes from all profiles
      document.querySelectorAll(".member-profile").forEach(el => {
        el.classList.remove("selected-member", "highlight");
      });
      
      // Clear any existing district overlay on the map.
      if (typeof removeDistrictOverlays === "function") {
        removeDistrictOverlays();
      }
      
      // Mark this profile as selected
      memberDiv.classList.add("selected-member");

      // Set the selected member and update the radar chart
      window.selectedMemberID = member.bioguide_id;
      updateRadarChart(window.selectedMemberID);
      
      // If the member is in the House, update the map to center on and highlight their district.
      if (member.chamber === "House of Representatives") {
        let districtNum = parseInt(member.district, 10);
        if (!isNaN(districtNum)) {
          let formattedDistrict = formatDistrict(districtNum);
          // Find the district in the already-loaded stateDistricts array
          let matchingDistrict = stateDistricts.find(d => {
            let dnum = parseInt(d.properties.DISTRICT, 10);
            return !isNaN(dnum) && formatDistrict(dnum) === formattedDistrict;
          });
          if (matchingDistrict) {
            console.log("Found matching district for", member.name, matchingDistrict.properties.OFFICE_ID);
            // Compute map center and zoom based on the district's geometry
            let { minLon, maxLon, minLat, maxLat } = getGeoBounds(matchingDistrict.geometry);
            let lonCenter = (minLon + maxLon) / 2;
            let latCenter = (minLat + maxLat) / 2;
            let optimalScale = calculateZoom(minLon, maxLon, minLat, maxLat);
            // Re-center the map
            Plotly.relayout("plotly-map", {
              "geo.center": { lon: lonCenter, lat: latCenter },
              "geo.projection.scale": optimalScale,
            }).then(() => {
              // Add a short delay before updating the district overlay
              setTimeout(() => {
                updateDistrictOverlay(matchingDistrict);
              }, 200);
            });
          } else {
            console.warn("No matching district found for", member.name);
          }
        }
      } else if (member.chamber === "Senate") {
        // For senators, update the map using the state overlay
        let matchingState = states.features.find(d => d.properties.STUSPS === member.state);
        if (matchingState) {
          stateClicked(matchingState.properties.STATEFP);
        } else {
          console.warn("No matching state found for senator", member.name);
        }
      }
    });

    memberInfo.appendChild(leftColumn);
    memberInfo.appendChild(rightColumn);
    memberDiv.appendChild(img);
    memberDiv.appendChild(memberInfo);
    memberDetails.appendChild(memberDiv);
  });

  console.log("Member details updated:", memberDetails.innerHTML);
  console.log("Member profiles rendered successfully.");
}

async function ensureCongressMembersLoaded() {
  if (!window.membersData || window.membersData.length === 0) {
    console.warn("Congress members not loaded. Fetching data...");
    await fetchCongressMembers();
  }
}

function restorePreviousMemberList() {
  if (window.previousMemberList && window.previousMemberList.length > 0) {
    console.log("Restoring previous member list...");
    renderMemberList(window.previousMemberList);
  } else {
    console.warn("No previous member list to restore.");
  }
}
