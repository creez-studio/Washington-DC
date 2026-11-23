/* =====================================================================
   The reasoning layer: WHY each step is done (and whether it can be
   skipped), plus a one-line game plan for every question type.
   Matched to walkthrough steps by title.
   ===================================================================== */
(function () {
  'use strict';
  const BM_WHY = 'Bending is caused by moment: curvature = M/EI. Slope and deflection are that curvature added up along the beam, so without the moment diagram there is nothing to add up. Splitting it load by load keeps every shape simple (triangle, spandrel) so its area has a ready formula.';
  const MOHR1 = 'Mohr\'s first theorem: adding up the curvature M/EI along the beam gives the change in slope, and that sum is the area of the diagram. The slope at the wall is zero, so the area IS the slope at B. You cannot skip it: it is the slope.';
  const MOHR2 = 'Mohr\'s second theorem: deflection = moment of the M/EI area about B. A bend far from B swings B through a longer lever, so each area is weighted by its distance. Because the tangent at the wall stays horizontal, this deviation is the real deflection.';
  const CENT = 'A bit of curvature far from B moves B more than the same curvature near B. The centroid lets us treat a whole area as if it sat at one distance. Using the wrong end (from A instead of B) is the most common mistake.';
  const STATICS = 'Once the extra unknown is found, the beam behaves like an ordinary determinate beam: ΣV = 0 and ΣM = 0 give everything else. Doing this earlier is impossible because there would be one unknown too many.';
  const RULES = [
    [/^Where does the beam move most/, 'The question asks for MAXIMUM values. Knowing they occur at the free end tells us which point to measure everything to. Skip it and you might measure to the wrong point and get a smaller, wrong answer.'],
    [/^Bending moment from each load|^Moment from each load|^Moment diagram/, BM_WHY],
    [/^Area of the M\/EI diagram/, MOHR1],
    [/^Slope at B = total area|^Slope = sum of areas/, 'Each load bends a linear elastic beam independently, so their effects simply add (superposition). Adding the areas gives the total slope.'],
    [/^Balance point of each area|^Distance of each load from B/, CENT],
    [/^Deflection at B = area|^Deflection = area/, MOHR2],
    [/^Make the twin|^The twin of a simply/, 'The twin (conjugate) beam turns a geometry problem into a statics problem you already know: slope becomes shear, deflection becomes moment. Supports are swapped so that the twin\'s moment is zero exactly where the real beam cannot deflect.'],
    [/become loads on the twin/, 'In the conjugate method the M/EI diagram IS the load on the twin. Each area is the size of one load, so we need the areas before any shear or moment can be found.'],
    [/^Slope = shear/, 'Conjugate theorem 1: slope of the real beam = shear force of the twin. At the twin\'s wall the shear equals the total load on it.'],
    [/^Deflection = moment at the twin/, 'Conjugate theorem 2: deflection of the real beam = bending moment of the twin. Moment = each load × its distance, added up.'],
    [/^Divide by stiffness/, 'Curvature is M divided by EI, not M alone. The 2EI part bends half as much for the same moment. Forgetting to divide overestimates the deflection.'],
    [/^Split into simple shapes/, 'We only know areas and centroids of simple shapes. A trapezium is a rectangle plus a triangle, each with a known formula and balance point.'],
    [/^Central load → triangle|^Full UDL → parabola/, 'By symmetry the slope is zero at the centre, which is where the deflection is largest, so half the diagram is enough. Each half-area is one reaction of the twin, and its moment at the centre is the deflection.'],
    [/^Answers$/, 'Loads act independently on a linear elastic beam, so the effects of the point load and the UDL simply add up.'],
    [/^One support too many/, 'Counting first tells you how many extra equations you need. Statics gives 3; one extra unknown means exactly one extra equation, which must come from how the beam deforms.'],
    [/^Take the prop away/, 'Without the prop the beam is a cantilever, which we already know how to solve. We then put the prop back as an unknown force. This is the whole idea of "consistent deformation".'],
    [/^Push (the tip )?up/, 'R_B is the unknown. Finding how far it lifts the tip lets us choose the R_B that exactly cancels the drop.'],
    [/^The prop does not move/, 'The real tip rests on the prop, so its total movement is zero. This compatibility condition is the extra equation that statics could not give.'],
    [/^The other reactions|^Statics for the rest|^Back to statics/, STATICS],
    [/^Biggest sagging moment/, 'The moment is largest where its slope is zero, and the slope of the moment diagram is the shear force (dM/dx = V). Designers size the beam for this peak, and KTU awards marks for it.'],
    [/^Free the right end/, 'A fixed end hides two unknowns: a force and a moment. Releasing it leaves a cantilever we can solve. The real end neither turns nor moves, and those two facts give two equations.'],
    [/^Free end under the load/, 'We need how much the released tip tilts and drops, so the two unknowns can be chosen to cancel both.'],
    [/^Two conditions, two unknowns/, 'Two unknowns need two equations: zero slope and zero deflection at the real fixed end.'],
    [/^Bending moment diagram$/, 'The diagram shows where the beam is stressed most (hogging at supports, sagging in the span). That is what a designer sizes the beam for, and KTU asks you to draw it.'],
    [/^Clapeyron/, 'The equation is a compatibility condition at the middle support: the two spans meeting at B must have the same slope there. It replaces solving each span separately.'],
    [/^Each span as a simple beam/, 'The theorem starts from the free (simply supported) moment of each span. The support moments are then subtracted from it.'],
    [/^The 6Ax̄\/L terms/, 'These terms measure how strongly each span\'s load tries to rotate the beam at the support. The UDL shortcut wL³/4 saves time in the exam.'],
    [/^Solve for the support moments/, 'The support moments are the only unknowns. Once found, the reactions and the diagram follow from statics.'],
    [/^Reactions and final diagram/, 'Support moments shift load between supports, so reactions differ from the simple-beam values by (difference of end moments) ÷ span.'],
    [/^Which joints can twist/, 'Slope deflection is a displacement method: the unknowns are joint rotations. Counting them tells you how many equations you will write. Fixed ends cannot turn, so they are not unknowns.'],
    [/^Fixed end moments|^Lock every joint/, 'With every joint locked, each span is a fixed beam with ready-made formulas. This gives the starting moments before the joints are allowed to turn.'],
    [/^Slope deflection equation for each end/, 'This equation links every end moment to the unknown twists. Without one per member end you cannot write the joint balance in the next step.'],
    [/^Each free joint must balance/, 'A joint at rest has no net moment, so the end moments meeting there add to zero. That gives exactly one equation per unknown twist.'],
    [/^Solve the twists/, 'Once the twists are known, every end moment is known. They are only a means to the moments; KTU marks the moments.'],
    [/^Final end moments|^Final moments/, 'These are the answers. Check: at each free joint they add to zero. Their signs tell you hogging or sagging for the diagram.'],
    [/^Support reactions$/, 'Reactions size the supports and give the shear force diagram. End moments move some load from one support to the other, so simple-beam reactions are not enough.'],
    [/^Who takes how much/, 'When a joint is released, stiffer members resist more and so take more of the unbalanced moment. Distribution factors split it in proportion to stiffness, and the shares add to 1.'],
    [/^Release the simple end/, 'A simple support cannot hold a moment, so we free it once at the start and use the 3EI/L stiffness afterwards. This saves many rounds.'],
    [/unlock and balance/, 'The moments at the joint do not add to zero yet. Unlocking lets the joint rotate until they do, and each member takes its DF share of the correction.'],
    [/carry half across/, 'Turning one end of a member whose far end is held creates half that moment at the far end, with the same sign. That is the carry over factor ½ (zero to a simple end).'],
    [/^Repeat until/, 'Each carry-over slightly unbalances the neighbouring joint again. Every round is smaller, and the totals converge to the exact slope deflection answer. Stopping too early leaves a small error.'],
    [/^Support reactions of the portal/, 'The beam passes its end shear down each column as the vertical reaction. The column end moments create the horizontal kick at each foot, which the foundations must resist.'],
    [/^Stiffness of each member/, 'Distribution factors depend on how hard each member is to rotate. A member with a hinged far end can swing freely, so it is less stiff (3 instead of 4).'],
    [/^Share = k ÷ total/, 'The whole unbalanced moment must be shared out, so each share is its stiffness divided by the total, and the shares add to 1.'],
    [/^Why an arch needs H/, 'A three hinged arch has 4 unknown reactions but statics gives only 3. The crown hinge, where the moment is zero, provides the 4th equation.'],
    [/^Vertical reactions/, 'Both supports are at the same level, so H has no lever arm about either support. The vertical reactions come out exactly as for a simple beam.'],
    [/^Thrust H from the top hinge/, 'A hinge cannot carry moment, so at the crown (beam moment) − H × rise = 0. That single condition gives H.'],
    [/^Total reaction = Pythagoras/, 'The support pushes with both components at once. The resultant is their vector sum, and its angle tells the abutment designer which way the force acts.'],
    [/^Height and steepness/, 'The arch moment needs the height y at the section, and the thrust and shear need the angle θ of the arch there.'],
    [/^Bending moment = beam moment/, 'H acts along the line of the supports, a height y below the arch, so it creates a moment H·y opposite to the loads\' moment. Subtracting it is why arches carry big loads with little bending.'],
    [/^Thrust along, shear across/, 'Design checks squeezing along the arch (N) and sliding across it (S) separately, so the forces at the cut are split into those two directions.'],
    [/^A cable hangs in the shape/, 'A cable cannot resist bending, so at every point H·y must exactly balance the simple-beam moment. That is the general cable theorem, and it gives everything else.'],
    [/^Pull H from the known dip/, 'This is the only point where both the dip and the moment are known, so H = M ÷ y. With no sideways loads, H is the same everywhere along the cable.'],
    [/^Dips at the other points/, 'With H known, the same theorem gives every other dip: y = M ÷ H.'],
    [/^Tension in piece/, 'Tension acts along the piece, and its horizontal part is always H. So tension = H ÷ cos(angle) = H × length ÷ dx. Steeper pieces carry more.'],
    [/^Total length/, 'The length is needed to cut and order the cable. Each piece is a right-angled triangle, so Pythagoras gives it.'],
    [/^Shape of the cable/, 'KTU asks this derivation directly ("derive the equation of a cable"). Taking moments of one part about a cut gives the parabola.'],
    [/^Horizontal pull H/, 'At mid span the beam moment is wL²/8 and the dip is d. The cable theorem H·d = wL²/8 gives H.'],
    [/^Biggest pull at the supports/, 'The cable is steepest at the supports, where it carries H plus half the total load vertically. That is where it is most likely to snap.'],
    [/^Length of cable/, 'Needed to order the cable. A small dip adds very little length, so the approximate formula is accurate.'],
    [/guide pulley|saddle with rollers/, 'How the cable sits on the tower decides whether the tower is bent or only pushed down. That changes the tower\'s design completely.'],
    [/^All answers/, 'KTU marks each part separately. Check that every quantity asked for is written with its unit and direction.'],
  ];
  const GOALS = {
    'm1-cant-udl-point': ['Find θ and δ at the free end.', 'Moments → M/EI areas → Mohr\'s two theorems.'],
    'm1-cant-two-point': ['Find θ and δ at the free end.', 'Make the twin beam → load it with M/EI → its shear and moment are the answers.'],
    'm1-cant-stepped': ['Find θ and δ at the free end of a beam with two stiffnesses.', 'Moments → divide by the right EI → split into simple shapes → Mohr\'s theorems.'],
    'm1-ss': ['Find the end slope and the centre deflection.', 'Twin beam with the same supports → half the M/EI diagram → reaction and moment of the twin.'],
    'm2-propped-udl': ['Find the reactions and the moments.', 'Remove the extra support → see how far the tip drops → find the force that pushes it back.'],
    'm2-propped-point': ['Find the reactions and the moments.', 'Remove the extra support → see how far the tip drops → find the force that pushes it back.'],
    'm2-fixed': ['Find the fixing moments and reactions.', 'Free one end → cancel its slope and its deflection → statics.'],
    'm2-three-moment': ['Find the support moments.', 'Free moment of each span → Clapeyron\'s equation at the middle support → solve → reactions.'],
    'm3-beam': ['Find the end moments.', 'Lock the joints (FEM) → let them twist (θ) → balance each joint → solve.'],
    'm3-frame': ['Find the end moments of the frame.', 'Lock the joints (FEM) → let them twist (θ) → balance each joint → solve.'],
    'm4-beam': ['Find the end moments.', 'Lock every joint, then unlock one at a time and share the moment by stiffness until everything balances.'],
    'm4-frame': ['Find the end moments of the frame.', 'Lock every joint, then unlock one at a time and share the moment by stiffness until everything balances.'],
    'm4-df': ['Find the distribution factors.', 'Stiffness of each member → each member\'s share of the total.'],
    'm5-parabolic': ['Find the reactions and the forces at a section.', 'V like a beam → H from the crown hinge → geometry at the cut → M, N, S.'],
    'm5-circular': ['Find the reactions and the forces at a section.', 'V like a beam → H from the crown hinge → circle geometry at the cut → M, N, S.'],
    'm5-cable-points': ['Find H, the dips, the tensions and the length.', 'General cable theorem H·y = M, used point by point.'],
    'm5-cable-udl': ['Find H, T max, the length and the pier forces.', 'Parabola from H·y = M → H → T at supports → pulley vs saddle.'],
  };
  function why(title) { for (const [re, w] of RULES) if (re.test(title)) return w; return ''; }
  window.WHY = { why, goal: (id) => GOALS[id] || ['Solve the question.', 'Follow the steps.'] };
})();
