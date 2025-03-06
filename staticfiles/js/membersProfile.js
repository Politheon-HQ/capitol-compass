
let membersData = [];

fetch("https://backend-server-304538040372.us-central1.run.app/api/congress_members")
    .then(response => response.json())
    .then(data => {
        window.membersData = data.members;
        console.log("Loaded Congress members data:", window.membersData);
    })
    .catch(error => {
        console.error("Error loading Congress members data:", error);
    });

// Function to update members based on state selection
function updateMemberProfile(stateID) {
    const memberDetails = document.getElementById("member-details");

    if (!window.membersData || window.membersData.length === 0) {
        memberDetails.innerHTML = "<p>Loading members...</p>";
        return;
    }

    // Filter members by state
    const stateMembers = window.membersData.filter(member => member.state === stateID);
    if (stateMembers.length === 0) {
        memberDetails.innerHTML = `<p>No members found for ${stateID}.</p>`;
        return;
    }

    // Store all state members for filtering later
    window.allStateMembers = stateMembers;

    // Generate HTML for each member profile
    renderMemberList(stateMembers);
}

// Function to filter members by district
function filterMembersByDistrict(districtID) {
    if (!window.allStateMembers || window.allStateMembers.length === 0) return;

    const filteredMembers = window.allStateMembers.filter(member => {
        const parsedDistrict = parseInt(member.district, 10);
        return !isNaN(parsedDistrict) && parsedDistrict === parseInt(districtID, 10);
    });

    if (filteredMembers.length === 0) {
        document.getElementById("member-details").innerHTML = `<p>No members found for District ${districtID}.</p>`;
    } else {
        renderMemberList(filteredMembers);
    }
}

// Function to dynamically render member profiles
function renderMemberList(members) {
    let memberDetails = document.getElementById("member-details");
    let profileHTML = "";   

    members.forEach(member => {
        const parsedDistrict = parseInt(member.district, 10);
        const districtDisplay = (!isNaN(parsedDistrict) && member.chamber === "House of Representatives")
            ? `<span><strong>District:</strong> ${parsedDistrict}<span><br>`
            : "";

        profileHTML += `
            <div class="member-profile" id="member-profile-${member.name}" data-name-id="${member.name}">
                <img class="profile-image" src="${member.image_url}" alt="Profile image of ${member.name}">
                <div class="member-info">
                    <span><strong>Name:</strong> <span class="member-name" data-name-id="${member.name}">${member.name}<span><br>
                    <span><strong>Party:</strong> ${member.party}<span><br>
                    <span><strong>Chamber:</strong> ${member.chamber}<span><br>
                    ${districtDisplay}
                    <span><strong>Years Active:</strong> ${member.start_year} - Present<span><br>
                    <span><strong>Bills Sponsored:</strong> ${member.ponsored_bills}<span><br>
                    <span><strong>Bills Co-sponsored:</strong> ${member.cosponsored_bills}<span><br>
                    <span><strong>Committee Assignments:</strong> ${member.committee_assignments}<span><br>
                    <span><strong>Phone:</strong> ${member.phone_number}<span><br>
                    <span><strong>Website:</strong> <a href="${member.website_url}" target="_blank">${member.website_url}</a><span>
                    <span><strong>Address:</strong> ${member.address}<span><br>
                </div>
            </div>
        `;
    });
               
    memberDetails.innerHTML = profileHTML;
}