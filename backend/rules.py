def rule_based_insight(results):
    total_votes = sum(r['votes'] for r in results)
    if total_votes < 20:
        return None

    sorted_results = sorted(results, key=lambda x: x['votes'], reverse=True)
    top = sorted_results[0]

    if total_votes > 0 and top['votes'] / total_votes >= 0.6:
        return f"Clear favorite emerging: {top['option']}"

    if len(sorted_results) > 1:
        diff = top['votes'] - sorted_results[1]['votes']
        if diff / total_votes >= 0.1:
            return f"{top['option']} holds a comfortable lead."
        if diff / total_votes <= 0.05:
            return "It's a close race!"

    return None
