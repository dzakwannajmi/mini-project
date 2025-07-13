import Nat           "mo:base/Nat";
import Principal     "mo:base/Principal";
import HashMap       "mo:base/HashMap";
import Iter          "mo:base/Iter"; // ✅ Tambahan penting untuk menghitung total suara

actor Voting {

  public type Language = { #rust; #assemblyScript; #motoko };

  let votes : HashMap.HashMap<Principal, Language> =
    HashMap.HashMap<Principal, Language>(
      20,
      Principal.equal,
      Principal.hash
    );

  // ✅ Fungsi untuk mengambil hasil voting
  public query func getResults() : async { rust: Nat; as: Nat; motoko: Nat } {
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
    return { rust = r; as = a; motoko = m };
  };

  // ✅ Fungsi untuk menghitung total suara masuk
  public query func totalVotes() : async Nat {
    return Iter.size(votes.keys()); // Hitung jumlah key = jumlah suara
  };

  // ✅ Fungsi untuk cek apakah caller sudah pernah voting
  public shared query(funcMsg) func hasVoted() : async Bool {
    let caller = funcMsg.caller;
    switch (votes.get(caller)) {
      case (?_)  true;
      case null false;
    }
  };

  // ✅ Fungsi untuk vote pilihan
  public shared(funcMsg) func vote(lang: Language) : async Bool {
    let caller = funcMsg.caller;
    let alreadyVoted = switch (votes.get(caller)) {
      case (?_) true;
      case null false;
    };
    if (alreadyVoted) {
      return false; // tidak boleh voting 2x
    };
    votes.put(caller, lang);
    return true;
  };

  // ✅ Fungsi greet untuk user login
  public shared query(funcMsg) func greet() : async Text {
    let caller = funcMsg.caller;
    return "Hello, user " # Principal.toText(caller) # " 👋";
  };
}
