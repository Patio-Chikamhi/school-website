// LinkParentAccount.jsx - Component for parents to link to student
const LinkParentAccount = () => {
    const [studentId, setStudentId] = useState('');
    const [parentEmail, setParentEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
  
    const linkAccount = async () => {
      setLoading(true);
      setError('');
      
      try {
        const user = auth.currentUser;
        if (!user) throw new Error('Please log in first');
        
        // Find student by ID
        const studentDoc = await getDoc(doc(db, 'students', studentId));
        if (!studentDoc.exists()) {
          throw new Error('Student not found');
        }
        
        const studentData = studentDoc.data();
        
        // Verify parent email matches
        if (studentData.parentEmail !== user.email) {
          throw new Error('Email does not match registered parent email');
        }
        
        // Update student document
        await updateDoc(doc(db, 'students', studentId), {
          linkedParentAccounts: arrayUnion(user.uid),
          parentUserId: user.uid
        });
        
        // Update parent document
        await updateDoc(doc(db, 'users', user.uid), {
          linkedStudentIds: arrayUnion(studentId),
          role: 'parent'
        });
        
        setSuccess(true);
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };
  
    return (
      <div className="max-w-md mx-auto p-6">
        <h2 className="text-2xl font-bold mb-6">Link to Your Child</h2>
        
        {success ? (
          <div className="bg-emerald-50 p-6 rounded-xl">
            <div className="text-emerald-600 font-semibold mb-2">Successfully Linked!</div>
            <p>You can now view your child's performance on your dashboard.</p>
          </div>
        ) : (
          <>
            <input
              type="text"
              placeholder="Student ID"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              className="w-full p-3 border rounded-lg mb-4"
            />
            <p className="text-sm text-gray-500 mb-6">
              Enter the Student ID provided by the school. 
              Your email must match the parent email on file.
            </p>
            
            {error && <div className="text-red-600 mb-4">{error}</div>}
            
            <button
              onClick={linkAccount}
              disabled={loading || !studentId}
              className="w-full bg-emerald-600 text-white p-3 rounded-lg hover:bg-emerald-700 disabled:opacity-50"
            >
              {loading ? 'Linking...' : 'Link Account'}
            </button>
          </>
        )}
      </div>
    );
  };