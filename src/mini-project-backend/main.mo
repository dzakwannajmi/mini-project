// File: src/mini_project_backend/main.mo
// Description: This canister serves as the backend for a simple voting application.
//          It allows users to log in using Internet Identity,
//          cast a unique vote for one of three programming languages,
//          and view the voting results in real-time.

// Import essential modules from the Motoko base library.
import Nat           "mo:base/Nat";       // Used for natural numbers (non-negative integers).
import Principal     "mo:base/Principal";  // Used to identify users (principal IDs).
import HashMap       "mo:base/HashMap";    // Data structure for storing key-value pairs.
// import Debug         "mo:base/Debug";      // Debugging module, commented out as not actively used.

// Declaration of the main canister actor.
actor {
  // Custom type definition 'Language' to represent the voting options.
  // This is a variant type allowing one of three values: #rust, #assemblyScript, or #motoko.
  public type Language = { #rust; #assemblyScript; #motoko };

  // Declaration of 'votes' as a stable HashMap.
  // 'stable' means this data will persist across canister upgrades.
  // Key: Principal (the unique identity of a user who has voted).
  // Value: Language (the language chosen by that Principal).
  // This HashMap effectively ensures that each Principal can cast only one vote.
  let votes : HashMap.HashMap<Principal, Language> =
    HashMap.HashMap<Principal, Language>(
      20,                // Initial capacity of the HashMap. Can be adjusted based on estimated voter count.
      Principal.equal,   // Comparison function used by HashMap to check Principal equality.
      Principal.hash     // Hashing function used by HashMap for Principals.
    );

  /**
   * @function getResults
   * @description Returns the current vote counts for each programming language.
   * This is a 'query' function, meaning it does not modify the canister's state and can be executed quickly.
   * @returns {rust: Nat; assemblyScript: Nat; motoko: Nat} A record containing the total votes for Rust, AssemblyScript, and Motoko.
   */
  public query func getResults() : async { rust: Nat; assemblyScript: Nat; motoko: Nat } {
    var r: Nat = 0; // Initialize vote counter for Rust
    var a: Nat = 0; // Initialize vote counter for AssemblyScript
    var m: Nat = 0; // Initialize vote counter for Motoko

    // Iterate through each entry (key-value pair) in the 'votes' HashMap.
    // The key (Principal) is ignored with '_' as we only need the value (the chosen language).
    for ((_, lang) in votes.entries()) {
      // Use a 'switch' statement to increment the vote count based on the selected language.
      switch (lang) {
        case (#rust)         { r += 1 };
        case (#assemblyScript) { a += 1 };
        case (#motoko)         { m += 1 };
      };
    };
    // Return the results as a record.
    return { rust = r; assemblyScript = a; motoko = m };
  };

  /**
   * @function totalVotes
   * @description Calculates and returns the total number of votes cast.
   * Since each Principal can vote only once, this also represents
   * the number of unique Principals who have participated in the voting.
   * This is a 'query' function, meaning it does not modify the canister's state.
   * @returns {Nat} The total number of votes.
   */
  public query func totalVotes() : async Nat {
    var count : Nat = 0; // Initialize total vote counter
    // Iterate through all keys (Principals) in the 'votes' HashMap.
    // Each key represents a unique vote that has been recorded.
    for (key in votes.keys()) {
      count += 1; // Increment the count for each Principal found.
    };
    return count; // Return the total vote count.
  };

  /**
   * @function hasVoted
   * @description Checks if the Principal calling this function has already cast a vote.
   * This is a 'query' function executed by the calling Principal.
   * @param {funcMsg} funcMsg An object containing call metadata, including 'caller' (the calling Principal).
   * @returns {Bool} 'true' if the Principal has voted, 'false' otherwise.
   */
  public shared query(funcMsg) func hasVoted() : async Bool {
    let caller = funcMsg.caller; // Get the Principal of the entity calling this function.
    // Check if the 'caller' Principal exists as a key in the 'votes' HashMap.
    switch (votes.get(caller)) {
      case (?_)  true;  // If 'votes.get(caller)' returns Some(value), the Principal has voted.
      case null false; // If it returns null, the Principal has not voted.
    }
  };

  /**
   * @function vote
   * @description Allows the calling Principal to cast a vote for a specific language.
   * Each Principal can only cast one vote.
   * This is an 'update' function because it modifies the canister's state (adds an entry to the 'votes' HashMap).
   * @param {lang: Language} lang The language option to vote for.
   * @param {funcMsg} funcMsg An object containing call metadata, including 'caller' (the calling Principal).
   * @returns {Bool} 'true' if the vote was successfully recorded, 'false' if the Principal had already voted.
   */
  public shared(funcMsg) func vote(lang: Language) : async Bool {
    let caller = funcMsg.caller; // Get the Principal of the entity calling this function.

    // First, check if the calling Principal has already voted.
    if (votes.get(caller) != null) {
      // If the Principal already exists in the HashMap, they have already voted.
      // Return false to prevent duplicate votes.
      return false;
    };

    // If the Principal has not voted, record their vote.
    // Debug.print("🗳️ Vote from: " # Principal.toText(caller)); // Uncomment for logging in dfx console
    votes.put(caller, lang); // Add the Principal and their chosen language to the HashMap.
    return true; // The vote was successfully recorded.
  };

  /**
   * @function greet
   * @description Returns a personalized greeting message to the Principal calling this function.
   * This is a 'query' function that does not modify the canister's state.
   * @param {funcMsg} funcMsg An object containing call metadata, including 'caller' (the calling Principal).
   * @returns {Text} The greeting message.
   */
  public shared query(funcMsg) func greet() : async Text {
    let caller = funcMsg.caller; // Get the Principal of the entity calling this function.
    return "Hello, user " # Principal.toText(caller) # " 👋"; // Return the greeting message.
  };
}
