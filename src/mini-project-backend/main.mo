import Nat           "mo:base/Nat";
import Principal     "mo:base/Principal";
import HashMap       "mo:base/HashMap";
import Debug         "mo:base/Debug";

actor {
  public type Language = { #rust; #assemblyScript; #motoko };

  let votes : HashMap.HashMap<Principal, Language> =
    HashMap.HashMap<Principal, Language>(
      20,
      Principal.equal,
      Principal.hash
    );

  public query func getResults() : async { rust: Nat; assemblyScript: Nat; motoko: Nat } {
    var r: Nat = 0;
    var a: Nat = 0;
    var m: Nat = 0;
    for ((_, lang) in votes.entries()) {
      switch (lang) {
        case (#rust)            { r += 1 };
        case (#assemblyScript) { a += 1 };
        case (#motoko)         { m += 1 };
      };
    };
    return { rust = r; assemblyScript = a; motoko = m };
  };

  public query func totalVotes() : async Nat {
    var count : Nat = 0;
    for (key in votes.keys()) {
      count += 1;
    };
    return count;
  };

  public shared query(funcMsg) func hasVoted() : async Bool {
    let caller = funcMsg.caller;
    switch (votes.get(caller)) {
      case (?_)  true;
      case null false;
    }
  };

  public shared(funcMsg) func vote(lang: Language) : async Bool {
    let caller = funcMsg.caller;

    if (votes.get(caller) != null) {
      return false;
    };

    Debug.print("🗳️ Vote dari: " # Principal.toText(caller));
    votes.put(caller, lang);
    return true;
  };

  public shared query(funcMsg) func greet() : async Text {
    let caller = funcMsg.caller;
    return "Hello, user " # Principal.toText(caller) # " 👋";
  };
}
